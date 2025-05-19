import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { LoginForm } from "@/components/LoginForm";

export default function Page() {
  return (
    <Dialog>
      <DialogContent>
        <LoginForm />
      </DialogContent>
    </Dialog>
  );
}
