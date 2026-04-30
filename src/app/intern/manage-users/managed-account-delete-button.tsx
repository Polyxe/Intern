"use client";

import { useActionState, useRef, useState } from "react";
import { Trash2 } from "lucide-react";

import { ConfirmActionModal } from "@/components/confirm-action-modal";

import { deleteManagedAccount, type ManageUsersState } from "./actions";

type ManagedAccountDeleteButtonProps = {
  userId: string;
  returnTo: string;
  userDisplayName: string;
};

const initialState: ManageUsersState = {
  error: "",
  success: "",
};

export function ManagedAccountDeleteButton({
  userId,
  returnTo,
  userDisplayName,
}: ManagedAccountDeleteButtonProps) {
  const [state, formAction, pending] = useActionState(deleteManagedAccount, initialState);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <form ref={formRef} action={formAction} className="inline-flex">
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="size-4" />
          ลบบัญชี
        </button>
      </form>

      <ConfirmActionModal
        open={confirmOpen}
        title="ยืนยันการลบบัญชี"
        description={`บัญชีของ ${userDisplayName} รวมถึงไฟล์ที่เกี่ยวข้องจะถูกลบถาวร และไม่สามารถกู้คืนได้`}
        confirmLabel="ลบบัญชี"
        pendingLabel="กำลังลบบัญชี..."
        pending={pending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          formRef.current?.requestSubmit();
        }}
      >
        {state.error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {state.error}
          </p>
        ) : null}
      </ConfirmActionModal>
    </>
  );
}