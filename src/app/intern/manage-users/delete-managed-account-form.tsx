"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

import { deleteManagedAccount, type ManageUsersState } from "./actions";

type DeleteManagedAccountFormProps = {
  userId: string;
};

const initialState: ManageUsersState = {
  error: "",
  success: "",
};

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="destructive"
      size="lg"
      className="h-12 rounded-2xl border border-red-200 px-6 text-sm font-semibold text-red-700 hover:border-red-300 hover:bg-red-50"
      disabled={pending}
    >
      {pending ? "กำลังลบ..." : "ลบบัญชีผู้ใช้"}
    </Button>
  );
}

export function DeleteManagedAccountForm({ userId }: DeleteManagedAccountFormProps) {
  const [state, formAction] = useActionState(deleteManagedAccount, initialState);

  return (
    <form action={formAction} className="rounded-[2rem] border border-red-200 bg-red-50/70 p-8 shadow-[0_18px_48px_rgba(208,82,58,0.08)] backdrop-blur sm:p-10">
      <input type="hidden" name="userId" value={userId} />

      <div className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-red-950">ลบบัญชีผู้ใช้</h2>
        <p className="text-sm leading-7 text-red-900">
          การลบจะนำข้อมูลบัญชีออกจากฐานข้อมูลทันที รวมถึงข้อมูลฝึกงานและไฟล์แนบที่ผูกกับบัญชีนี้
        </p>
      </div>

      {state.error ? (
        <p className="mt-5 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700">{state.error}</p>
      ) : null}

      <div className="mt-6">
        <DeleteButton />
      </div>
    </form>
  );
}