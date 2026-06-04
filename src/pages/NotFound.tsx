import { Button } from "@/components/ui/Button";

export function NotFound({ setActivePage }: { setActivePage: (page: string) => void }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="text-7xl font-black text-[#0f766e]">404</p>
      <h1 className="mt-3 text-3xl font-black">Page not found</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#667085]">This route does not exist in TaskFlow Pro.</p>
      <Button className="mt-6" onClick={() => setActivePage("dashboard")}>Back to dashboard</Button>
    </div>
  );
}
