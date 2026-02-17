import RoleLoginForm from "./_components/RoleLoginForm";

export default function LoginPage() {
  return (
    <RoleLoginForm
      role="tenant"
      title="Tenant sign in"
      subtitle="Enter your phone number and password to continue."
      allowCreate={false}
    />
  );
}
