import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

export default function SettingsPage() {
  const { endSession } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await endSession();
    showToast("You have been logged out.");
    navigate("/login");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Workspace preferences"
        title="Settings"
        description="A small, focused space for account-level actions."
      />
      <Card className="max-w-2xl p-6">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          Session
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Sign out of this browser when you are finished with your preparation
          session.
        </p>
        <div className="mt-5">
          <Button variant="danger" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </Card>
    </div>
  );
}
