import { RotateCcw } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMockAuth } from "@/context/MockAuth";
import { restartApp } from "@/lib/restart";

/** Restarts the whole app from the beginning, after one confirmation. */
export default function StartOverButton({ className = "" }: { className?: string }) {
  const { signOut } = useMockAuth();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button type="button" className={className}>
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
          Start over
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-[#0a0b12] border-white/10 text-white rounded-[1.5rem] sm:rounded-[1.5rem] p-7 max-w-[440px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading text-2xl">Start over from the beginning?</AlertDialogTitle>
          <AlertDialogDescription className="text-white/60 font-body">
            This clears your voyage, brief, design, order and tribe, and takes you back to the start.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white">
            Keep exploring
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => restartApp(signOut)} className="bg-white text-black hover:bg-white/90">
            Start over
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
