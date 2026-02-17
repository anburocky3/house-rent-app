import RoleLoginForm from "../_components/RoleLoginForm";

export default function AdminLoginPage() {
  return (
    <RoleLoginForm
      role="admin"
      title="Admin sign in"
      subtitle="Enter your phone number and password to continue."
      allowCreate={true}
    />
  );
}
