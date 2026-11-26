import CogViewer from "@/components/CogViewer";

export default function GearsPreviewPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-6">
      <div className="w-full max-w-2xl space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Create Cogwheel Preview</h1>
          <p className="text-sm text-zinc-400">
            Small &amp; large Create cogwheels rendered directly from Blockbench JSON.
          </p>
        </div>
        <CogViewer />
      </div>
    </main>
  );
}
