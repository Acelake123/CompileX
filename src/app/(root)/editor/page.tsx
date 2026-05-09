import EditorPanel from "../_components/EditorPanel";
import OutputPanel from "../_components/OutputPanel";
import NavigationHeader from "@/components/NavigationHeader";

export default function Home() {
  return (
    <div className="min-h-screen">
      <NavigationHeader />
      <div className="max-w-[1800px] mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EditorPanel />
          <OutputPanel />
        </div>
      </div>
    </div>
  );
}