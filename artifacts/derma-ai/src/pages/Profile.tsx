import { useState } from "react";
import { User, Settings, Bell, Lock, Shield, Camera, Save, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const TABS = [
  { key: "profile", label: "Profile", icon: User },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "password", label: "Change Password", icon: Lock },
  { key: "security", label: "Security", icon: Shield },
];

export default function Profile() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    name: "Dr. Muhammad Ali",
    email: "dr.muhammadali@dermaai.pk",
    phone: "+92-300-1234567",
    specialty: "Dermatologist",
    hospital: "Aga Khan University Hospital",
    city: "Karachi",
    experience: "15",
    license: "PMDC-12345",
    bio: "Senior dermatologist with 15 years of experience in skin cancer detection and treatment.",
  });
  const [notifications, setNotifications] = useState({
    emergencyAlerts: true,
    newAnalysis: true,
    appointments: true,
    reports: true,
    weeklyDigest: false,
    smsAlerts: true,
  });
  const [passForm, setPassForm] = useState({ current: "", newPass: "", confirm: "" });
  const [settings, setSettings] = useState({
    darkMode: true,
    autoDownloadReports: true,
    pstTimezone: true,
    highRiskAlerts: true,
    language: "English",
    aiModel: "DermaAI v2.1",
  });

  function handleSaveProfile() {
    toast({ title: "Profile updated", description: "Your profile information has been saved successfully." });
  }

  function handleChangePassword() {
    if (passForm.newPass !== passForm.confirm) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (passForm.newPass.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    toast({ title: "Password changed", description: "Your password has been updated successfully." });
    setPassForm({ current: "", newPass: "", confirm: "" });
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Account</h1>
        <p className="text-muted-foreground text-sm">Manage your profile, settings, and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left: Profile Card + Tabs */}
        <div className="space-y-4">
          {/* Profile Card */}
          <div className="bg-card border border-border rounded-xl p-5 text-center">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <div className="w-20 h-20 rounded-full gradient-purple flex items-center justify-center">
                <span className="text-white font-bold text-2xl">MA</span>
              </div>
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-card hover:bg-primary/80 transition-colors">
                <Camera size={12} className="text-white" />
              </button>
            </div>
            <div className="text-white font-bold">{form.name}</div>
            <div className="text-muted-foreground text-xs mt-0.5">{form.specialty}</div>
            <div className="text-muted-foreground text-xs">{form.hospital}</div>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-green-400 text-xs">Online</span>
            </div>
            <div className="mt-3 pt-3 border-t border-border text-left space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">License</span>
                <span className="text-white">{form.license}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Experience</span>
                <span className="text-white">{form.experience} years</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">City</span>
                <span className="text-white">{form.city}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-border last:border-0 ${activeTab === key ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted/20 hover:text-white"}`}
                data-testid={`tab-${key}`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Content */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl p-5">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-base">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Full Name", key: "name", placeholder: "Dr. Muhammad Ali" },
                  { label: "Email Address", key: "email", placeholder: "doctor@hospital.pk" },
                  { label: "Phone Number", key: "phone", placeholder: "+92-300-XXXXXXX" },
                  { label: "Specialty", key: "specialty", placeholder: "Dermatologist" },
                  { label: "Hospital / Clinic", key: "hospital", placeholder: "Hospital name" },
                  { label: "City", key: "city", placeholder: "Karachi" },
                  { label: "Years of Experience", key: "experience", placeholder: "15" },
                  { label: "PMDC License No.", key: "license", placeholder: "PMDC-XXXXX" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs text-muted-foreground block mb-1.5">{label}</label>
                    <Input
                      value={form[key as keyof typeof form]}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="bg-background h-9 text-sm"
                      data-testid={`input-profile-${key}`}
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Bio / About</label>
                <textarea
                  value={form.bio}
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-white resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Brief professional description..."
                />
              </div>
              <Button onClick={handleSaveProfile} className="gradient-purple border-0" data-testid="button-save-profile">
                <Save size={14} className="mr-2" /> Save Changes
              </Button>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-base">Application Settings</h2>
              <div className="space-y-4">
                {[
                  { key: "darkMode", label: "Dark Mode", desc: "Use dark theme across the application" },
                  { key: "autoDownloadReports", label: "Auto-download Reports", desc: "Automatically download PDF report after analysis" },
                  { key: "pstTimezone", label: "Pakistan Standard Time (PST)", desc: "Display all timestamps in PST (UTC+5)" },
                  { key: "highRiskAlerts", label: "High Risk Emergency Alerts", desc: "Auto-notify doctors when high-risk cases are detected" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-start justify-between py-3 border-b border-border/30 last:border-0">
                    <div>
                      <div className="text-white text-sm font-medium">{label}</div>
                      <div className="text-muted-foreground text-xs mt-0.5">{desc}</div>
                    </div>
                    <Switch
                      checked={settings[key as keyof typeof settings] as boolean}
                      onCheckedChange={v => setSettings(p => ({ ...p, [key]: v }))}
                      data-testid={`switch-${key}`}
                    />
                  </div>
                ))}
                <div className="py-3">
                  <div className="text-white text-sm font-medium mb-1">Language</div>
                  <select value={settings.language} onChange={e => setSettings(p => ({ ...p, language: e.target.value }))} className="bg-background border border-input text-white text-sm rounded-lg px-3 py-2 w-full max-w-xs">
                    <option>English</option>
                    <option>Urdu</option>
                  </select>
                </div>
                <div className="py-3">
                  <div className="text-white text-sm font-medium mb-1">AI Model Version</div>
                  <div className="flex items-center gap-3">
                    <Input value={settings.aiModel} readOnly className="bg-background h-9 text-sm max-w-xs opacity-60" />
                    <span className="text-green-400 text-xs">Up to date</span>
                  </div>
                </div>
              </div>
              <Button className="gradient-purple border-0" onClick={() => toast({ title: "Settings saved" })}>
                <Save size={14} className="mr-2" /> Save Settings
              </Button>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-base">Notification Preferences</h2>
              <div className="space-y-2">
                {[
                  { key: "emergencyAlerts", label: "Emergency Alerts", desc: "Instant alerts for high-risk case detections" },
                  { key: "newAnalysis", label: "New Analysis Complete", desc: "Notify when AI analysis finishes" },
                  { key: "appointments", label: "Appointment Reminders", desc: "Upcoming appointment notifications" },
                  { key: "reports", label: "Report Generation", desc: "Notify when PDF reports are generated" },
                  { key: "weeklyDigest", label: "Weekly Summary Digest", desc: "Weekly email summary of all analyses" },
                  { key: "smsAlerts", label: "SMS Alerts", desc: "Critical alerts via SMS to registered phone" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-start justify-between py-3 border-b border-border/30 last:border-0">
                    <div>
                      <div className="text-white text-sm font-medium">{label}</div>
                      <div className="text-muted-foreground text-xs mt-0.5">{desc}</div>
                    </div>
                    <Switch
                      checked={notifications[key as keyof typeof notifications]}
                      onCheckedChange={v => setNotifications(p => ({ ...p, [key]: v }))}
                    />
                  </div>
                ))}
              </div>
              <Button className="gradient-purple border-0" onClick={() => toast({ title: "Notification preferences saved" })}>
                <Save size={14} className="mr-2" /> Save Preferences
              </Button>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-base">Change Password</h2>
              <div className="max-w-sm space-y-4">
                {[
                  { label: "Current Password", key: "current" },
                  { label: "New Password", key: "newPass" },
                  { label: "Confirm New Password", key: "confirm" },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="text-xs text-muted-foreground block mb-1.5">{label}</label>
                    <div className="relative">
                      <Input
                        type={showPass ? "text" : "password"}
                        value={passForm[key as keyof typeof passForm]}
                        onChange={e => setPassForm(p => ({ ...p, [key]: e.target.value }))}
                        placeholder="••••••••"
                        className="bg-background h-9 text-sm pr-10"
                      />
                      <button onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
                <div className="p-3 bg-muted/20 rounded-lg border border-border text-xs text-muted-foreground space-y-1">
                  <div>Password requirements:</div>
                  <div className={passForm.newPass.length >= 8 ? "text-green-400" : ""}>• At least 8 characters</div>
                  <div className={/[A-Z]/.test(passForm.newPass) ? "text-green-400" : ""}>• One uppercase letter</div>
                  <div className={/[0-9]/.test(passForm.newPass) ? "text-green-400" : ""}>• One number</div>
                </div>
                <Button onClick={handleChangePassword} className="w-full gradient-purple border-0" data-testid="button-change-password">
                  <Lock size={14} className="mr-2" /> Update Password
                </Button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-5">
              <h2 className="text-white font-bold text-base">Security Settings</h2>
              <div className="space-y-4">
                <div className="p-4 bg-green-900/20 border border-green-700/30 rounded-xl flex items-center gap-3">
                  <Shield size={20} className="text-green-400 shrink-0" />
                  <div>
                    <div className="text-white text-sm font-semibold">Account Secured</div>
                    <div className="text-muted-foreground text-xs">Your account has two-factor authentication enabled</div>
                  </div>
                </div>
                {[
                  { label: "Two-Factor Authentication", desc: "Extra security layer for your account", enabled: true },
                  { label: "Session Timeout", desc: "Auto-logout after 30 minutes of inactivity", enabled: true },
                  { label: "Login Notifications", desc: "Email alert for new login attempts", enabled: false },
                ].map(({ label, desc, enabled }) => (
                  <div key={label} className="flex items-start justify-between py-3 border-b border-border/30 last:border-0">
                    <div>
                      <div className="text-white text-sm font-medium">{label}</div>
                      <div className="text-muted-foreground text-xs mt-0.5">{desc}</div>
                    </div>
                    <Switch defaultChecked={enabled} />
                  </div>
                ))}
                <div className="pt-4">
                  <div className="text-white text-sm font-semibold mb-3">Active Sessions</div>
                  <div className="p-3 bg-background rounded-lg border border-border flex items-center justify-between">
                    <div>
                      <div className="text-white text-xs font-medium">Chrome on Windows</div>
                      <div className="text-muted-foreground text-xs">Karachi, Pakistan · Current session</div>
                    </div>
                    <span className="text-green-400 text-xs">Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
