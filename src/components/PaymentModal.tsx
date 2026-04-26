import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  amount: number;
  upiId: string;
  payeeName: string;
  onConfirm: (utr: string) => void;
};

export const PaymentModal = ({ open, onClose, amount, upiId, payeeName, onConfirm }: Props) => {
  const [utr, setUtr] = useState("");

  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent("PRIME SMM Order")}`;

  const handleSubmit = () => {
    if (utr.trim().length < 6) {
      toast({ title: "Enter a valid UTR / Transaction ID" });
      return;
    }
    onConfirm(utr.trim());
    setUtr("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="display text-2xl tracking-wider text-primary">
            PAY ₹{amount.toFixed(2)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid place-items-center bg-white p-4 rounded-sm">
            <QRCodeSVG value={upiUrl} size={220} level="M" />
          </div>

          <div className="text-center text-sm space-y-1">
            <div className="text-muted-foreground">Scan with any UPI app</div>
            <div className="font-mono font-bold text-foreground">{upiId}</div>
            <div className="text-xs text-muted-foreground">{payeeName}</div>
          </div>

          <a
            href={upiUrl}
            className="block text-center text-xs text-primary underline"
          >
            Or tap here to open UPI app
          </a>

          <div className="space-y-2 pt-2 border-t border-border">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
              UTR / Transaction ID
            </Label>
            <Input
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="e.g. FMPIB5219717122"
              className="bg-input border-border focus-visible:ring-primary rounded-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              After paying, copy the UTR / Transaction ID from your UPI app and paste it here.
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full h-11 font-black uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm"
          >
            Submit & Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
