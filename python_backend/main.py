import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, BackgroundTasks
import redis.asyncio as redis
from pii_scrubber import sanitize_prompt

app = FastAPI(title="AI Hub Collaboration & Webhook API")

# Connect to local Redis for Pub/Sub (used to scale WebSockets across multiple workers)
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
except Exception as e:
    print(f"Failed to connect to Redis: {e}")
    redis_client = None

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, message: str, room_id: str):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_text(message)
                except Exception:
                    pass

manager = ConnectionManager()

@app.websocket("/ws/collab/{room_id}")
async def websocket_collab_endpoint(websocket: WebSocket, room_id: str):
    """
    WebSocket endpoint for multi-user collaboration (live cursors, shared prompts).
    Uses Redis Pub/Sub to broadcast messages across the room.
    """
    await manager.connect(websocket, room_id)
    
    pubsub = None
    listener_task = None
    
    if redis_client:
        pubsub = redis_client.pubsub()
        await pubsub.subscribe(f"room:{room_id}")
        
        async def redis_listener():
            async for message in pubsub.listen():
                if message['type'] == 'message':
                    await manager.broadcast(message['data'], room_id)

        listener_task = asyncio.create_task(redis_listener())

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            # Mask sensitive data if a user submits a shared prompt
            if payload.get("type") == "shared_prompt":
                original_text = payload.get("text", "")
                payload["text"] = sanitize_prompt(original_text)
                
            if redis_client:
                await redis_client.publish(f"room:{room_id}", json.dumps(payload))
            else:
                # Fallback to local broadcast if Redis is unavailable
                await manager.broadcast(json.dumps(payload), room_id)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        if listener_task:
            listener_task.cancel()
        if pubsub:
            await pubsub.unsubscribe(f"room:{room_id}")
        
        leave_msg = json.dumps({"type": "user_left"})
        if redis_client:
            await redis_client.publish(f"room:{room_id}", leave_msg)
        else:
            await manager.broadcast(leave_msg, room_id)

@app.post("/webhook/telegram")
async def telegram_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Webhook endpoint to receive updates from Telegram.
    Processes commands like /ask or /draw in the background.
    """
    update_data = await request.json()
    from bot import process_telegram_update
    
    # Process the update in the background so we can immediately return 200 OK to Telegram
    background_tasks.add_task(process_telegram_update, update_data)
    return {"status": "ok"}
