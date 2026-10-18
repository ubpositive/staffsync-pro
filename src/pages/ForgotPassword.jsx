import React from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

// No email service is configured for this app, so self-service reset links
// aren't available — an admin resets passwords directly from the User
// Management page (Settings) and shares the new temporary password with you.
export default function ForgotPassword() {
  return (
    <AuthLayout
      icon={Mail}
      title="Reset password"
      subtitle="Ask an admin to reset it for you"
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />Back to log in
        </Link>
      }
    >
      <p className="text-sm text-foreground text-center">
        This app resets passwords through an admin rather than email. Contact
        one of your admins and ask them to reset your password from the User
        Management page — they'll give you a new temporary password to log in with.
      </p>
    </AuthLayout>
  );
}
