"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AIContactInfo } from "@/types";

interface ContactInfoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contact: AIContactInfo | null;
}

export function ContactInfoDialog({ isOpen, onOpenChange, contact }: ContactInfoDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Contact Information</DialogTitle>
        </DialogHeader>
        {contact ? (
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={contact.name} readOnly />
            </div>
            {contact.title && (
              <div>
                <Label>Title</Label>
                <Input value={contact.title} readOnly />
              </div>
            )}
            {contact.email && (
              <div>
                <Label>Email</Label>
                <Input value={contact.email} readOnly />
              </div>
            )}
            {contact.phone && (
              <div>
                <Label>Phone</Label>
                <Input value={contact.phone} readOnly />
              </div>
            )}
            {contact.linkedin && (
              <div>
                <Label>LinkedIn</Label>
                <Input value={contact.linkedin} readOnly />
              </div>
            )}
            {contact.notes && (
              <div>
                <Label>Notes</Label>
                <Input value={contact.notes} readOnly />
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-600">No contact selected.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}


