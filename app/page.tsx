import AIHub from '@/components/AIHub';
import CollaborationLayer from '@/components/CollaborationLayer';

export default function Page() {
  return (
    <>
      <CollaborationLayer roomId="hub-general" />
      <AIHub />
    </>
  );
}
