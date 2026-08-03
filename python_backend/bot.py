import os
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from pii_scrubber import sanitize_prompt

# Telegram Bot Token (Should be set in environment variables)
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "MOCK_TOKEN_FOR_PREVIEW")

async def sync_to_google_drive(user_id: int, prompt: str, response: str):
    """
    Mock function to represent saving the bot conversation to Google Drive.
    In a production setup, this would use google-api-python-client with a Service Account
    or user-specific OAuth tokens stored in a database.
    """
    print(f"[Google Drive Sync] Saving conversation for user {user_id} to /AI_Hub_Vault/Conversations/")
    # Example logic:
    # 1. Build Google Drive API service
    # 2. Find or create folder /AI_Hub_Vault/Conversations/
    # 3. Create a Google Doc or .txt file with the conversation context
    pass

async def ask_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handles the /ask command.
    Usage: /ask gpt4o What is the capital of France?
    """
    if not context.args:
        await update.message.reply_text("Usage: /ask [model_name] [your query]")
        return
        
    model_name = context.args[0]
    query = " ".join(context.args[1:])
    
    if not query:
        await update.message.reply_text("Please provide a query.")
        return
        
    # 1. Sanitize the query before sending it to any external AI API
    safe_query = sanitize_prompt(query)
    
    # 2. Inform user we are processing (optional)
    msg = await update.message.reply_text(f"Querying {model_name} with sanitized prompt...")
    
    # 3. Forward to AI model (mocked here)
    # response = await call_llm_api(model_name, safe_query)
    ai_response = f"Simulated response from {model_name} for query: '{safe_query}'"
    
    # 4. Reply to user with the result
    await msg.edit_text(ai_response)
    
    # 5. Sync the interaction back to Google Drive
    await sync_to_google_drive(update.message.from_user.id, safe_query, ai_response)

async def draw_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handles the /draw command.
    Usage: /draw a futuristic city at sunset
    """
    description = " ".join(context.args)
    if not description:
        await update.message.reply_text("Usage: /draw [image description]")
        return
        
    # Sanitize the description to prevent PII leakage into image generation models
    safe_description = sanitize_prompt(description)
    
    msg = await update.message.reply_text(f"Generating image for: '{safe_description}'...")
    
    # Mock image generation URL
    image_url = "https://picsum.photos/400/400"
    
    await update.message.reply_photo(photo=image_url, caption=f"Generated for: {safe_description}")
    await msg.delete()
    
    await sync_to_google_drive(update.message.from_user.id, safe_description, "[Image Generated: URL]")

async def process_telegram_update(update_data: dict):
    """
    Processes an incoming webhook update dictionary from FastAPI.
    """
    if TELEGRAM_BOT_TOKEN == "MOCK_TOKEN_FOR_PREVIEW":
        print("Warning: Using mock Telegram token. Update processing will fail if real.")
        return
        
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CommandHandler("ask", ask_command))
    app.add_handler(CommandHandler("draw", draw_command))
    
    await app.initialize()
    update = Update.de_json(update_data, app.bot)
    await app.process_update(update)

if __name__ == "__main__":
    # Standalone execution for local testing with polling instead of webhooks
    print("Starting Telegram bot in polling mode...")
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    app.add_handler(CommandHandler("ask", ask_command))
    app.add_handler(CommandHandler("draw", draw_command))
    
    app.run_polling()
