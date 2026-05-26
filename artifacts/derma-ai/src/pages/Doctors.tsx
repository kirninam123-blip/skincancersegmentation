import { useState } from "react";
import { MapPin, Phone, Mail, Star, MessageCircle, PhoneCall, Calendar, Activity, CheckCircle, X, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CITIES = ["All", "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Peshawar"];

const DOCTORS = [
  { id: 1, name: "Dr. Ahmed Hassan",   specialty: "Dermatology & Skin Cancer Specialist",   hospital: "Shaukat Khanum Memorial Cancer Hospital", city: "Lahore",     experience: 18, rating: 4.9, phone: "+92-42-3590-5000", email: "ahmed.hassan@shaukat.pk",   bio: "Pioneer of AI-assisted dermatology in Pakistan. Senior dermatologist specializing in early-stage skin cancer detection.", isOnline: true  },
  { id: 2, name: "Dr. Fatima Khan",    specialty: "Dermatology & Oncology Specialist",       hospital: "Aga Khan University Hospital",             city: "Karachi",    experience: 14, rating: 4.8, phone: "+92-21-3493-0051", email: "fatima.khan@akuh.pk",        bio: "Specialist in melanoma and pigmented lesion analysis. Trained at London School of Dermatology.",              isOnline: true  },
  { id: 3, name: "Dr. Usman Ali",      specialty: "Consultant Dermatologist",                hospital: "PIMS (Pakistan Institute of Medical Sciences)", city: "Islamabad", experience: 12, rating: 4.7, phone: "+92-51-926-1170", email: "usman.ali@pims.pk",          bio: "Expert in non-surgical skin cancer treatment and photodynamic therapy.",                                       isOnline: true  },
  { id: 4, name: "Dr. Ayesha Malik",   specialty: "Pediatric Dermatologist",                 hospital: "Children Hospital Lahore",                 city: "Lahore",     experience:  9, rating: 4.6, phone: "+92-42-9923-1371", email: "ayesha.malik@chl.pk",        bio: "Pediatric dermatology specialist with focus on benign and malignant skin tumors in children.",                 isOnline: false },
  { id: 5, name: "Dr. Muhammad Tariq", specialty: "Mohs Surgery & Skin Cancer",              hospital: "Liaquat National Hospital",                city: "Karachi",    experience: 20, rating: 4.9, phone: "+92-21-3411-7460", email: "muhammad.tariq@lnh.pk",      bio: "Pakistan's leading Mohs micrographic surgery expert. 20+ years treating carcinomas.",                         isOnline: true  },
  { id: 6, name: "Dr. Sana Qureshi",   specialty: "Dermato-Oncology Specialist",             hospital: "Holy Family Hospital",                     city: "Rawalpindi", experience: 11, rating: 4.7, phone: "+92-51-923-0786",  email: "sana.qureshi@hfh.pk",        bio: "Specializes in dermoscopy and computer-aided diagnosis of pigmented skin lesions.",                            isOnline: true  },
  { id: 7, name: "Dr. Imran Qureshi",  specialty: "Consultant Dermatologist",                hospital: "Lady Reading Hospital",                    city: "Peshawar",   experience: 15, rating: 4.5, phone: "+92-91-921-0430",  email: "imran.qureshi@lrh.pk",       bio: "Pioneer of telemedicine dermatology in KPK. Expert in skin cancer detection for the Peshawar region.",        isOnline: true  },
  { id: 8, name: "Dr. Zara Hussain",   specialty: "Clinical Dermatologist",                  hospital: "Services Hospital",                        city: "Lahore",     experience:  8, rating: 4.4, phone: "+92-42-9203-4400", email: "zara.hussain@services.pk",   bio: "Expert in skin lesion biopsies and histopathological analysis with a focus on malignant tumors.",              isOnline: false },
  { id: 9, name: "Dr. Asif Mehmood",   specialty: "Surgical Dermatologist",                  hospital: "Civil Hospital Karachi",                   city: "Karachi",    experience: 16, rating: 4.6, phone: "+92-21-9920-4900", email: "asif.mehmood@civil.pk",      bio: "Surgical dermatologist specializing in excision of malignant skin lesions and reconstructive procedures.",     isOnline: true  },
];

const AVATAR_COLORS = [
  "from-purple-600 to-indigo-700","from-blue-600 to-cyan-700",
  "from-green-600 to-teal-700",  "from-orange-500 to-red-600",
  "from-pink-600 to-rose-700",   "from-yellow-500 to-orange-500",
  "from-teal-600 to-cyan-700",   "from-violet-600 to-purple-700",
  "from-sky-600 to-blue-700",
];

function getInitials(name: string) {
  return name.split(" ").slice(1, 3).map(p => p[0]).join("");
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 mt-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={10} className={i < Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-600"} />
      ))}
      <span className="text-yellow-400 text-xs ml-1 font-semibold">{rating.toFixed(1)}</span>
    </div>
  );
}

/* ── Message Modal ────────────────────────────────────────────────────── */
interface MsgModalProps {
  doctor: typeof DOCTORS[0];
  onClose: () => void;
  onSent: () => void;
}
function MessageModal({ doctor, onClose, onSent }: MsgModalProps) {
  const [senderName, setSenderName] = useState("");
  const [phone, setPhone]           = useState("");
  const [message, setMessage]       = useState("");
  const [sending, setSending]       = useState(false);

  function handleSend() {
    if (!senderName.trim() || !phone.trim() || !message.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      onSent();
      onClose();
    }, 900);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-white font-bold text-base">Send Message</h3>
            <p className="text-muted-foreground text-xs mt-0.5">to {doctor.name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white p-1"><X size={18} /></button>
        </div>

        {/* Doctor preview */}
        <div className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border mb-5">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${AVATAR_COLORS[doctor.id % AVATAR_COLORS.length]} flex items-center justify-center shrink-0`}>
            <span className="text-white font-bold text-sm">{getInitials(doctor.name)}</span>
          </div>
          <div>
            <div className="text-white text-sm font-semibold">{doctor.name}</div>
            <div className="text-primary text-xs">{doctor.specialty}</div>
            <div className="text-muted-foreground text-xs">{doctor.hospital}</div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Your Full Name *</label>
            <Input value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="Muhammad Ali" className="h-9 bg-background text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Your Phone Number *</label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+92-300-1234567" type="tel" className="h-9 bg-background text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Your Message *</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe your concern, symptoms, or question..."
              rows={4}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <Button variant="outline" onClick={onClose} className="flex-1 h-10 text-sm">Cancel</Button>
          <Button
            onClick={handleSend}
            disabled={!senderName.trim() || !phone.trim() || !message.trim() || sending}
            className="flex-1 h-10 gradient-purple border-0 text-sm gap-2"
          >
            {sending ? <><Activity size={14} className="animate-spin" /> Sending...</> : <><Send size={14} /> Send Message</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Doctors() {
  const [selectedCity, setSelectedCity] = useState("All");
  const [sentActions, setSentActions]   = useState<Record<string, boolean>>({});
  const [msgModal, setMsgModal]         = useState<typeof DOCTORS[0] | null>(null);
  const { toast } = useToast();

  const filtered = DOCTORS.filter(d => selectedCity === "All" || d.city === selectedCity);

  function markSent(doctorId: number, action: string) {
    setSentActions(prev => ({ ...prev, [`${doctorId}-${action}`]: true }));
  }

  function handleCall(doctor: typeof DOCTORS[0]) {
    markSent(doctor.id, "call");
    toast({ title: "Call Request Sent ✓", description: `Call request sent to ${doctor.name}. They will call you back shortly on your registered number.` });
  }

  function handleAppt(doctor: typeof DOCTORS[0]) {
    markSent(doctor.id, "appt");
    toast({ title: "Appointment Booked ✓", description: `Appointment booked with ${doctor.name}. You'll receive a confirmation SMS within 5 minutes.` });
  }

  function handleMsgSent(doctor: typeof DOCTORS[0]) {
    markSent(doctor.id, "msg");
    toast({ title: "Message Sent ✓", description: `Your message was sent to ${doctor.name}. You'll receive a reply within 24 hours.` });
  }

  return (
    <>
      {msgModal && (
        <MessageModal
          doctor={msgModal}
          onClose={() => setMsgModal(null)}
          onSent={() => handleMsgSent(msgModal)}
        />
      )}

      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Pakistani Doctors</h1>
            <p className="text-muted-foreground text-sm">Top dermatologists and skin cancer specialists across Pakistan</p>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
            <Activity size={15} className="text-primary" />
            <span className="text-white text-sm font-semibold">{filtered.length}</span>
            <span className="text-muted-foreground text-xs">Doctors Found</span>
          </div>
        </div>

        {/* City filters */}
        <div className="flex gap-2 flex-wrap">
          {CITIES.map(city => (
            <button key={city} onClick={() => setSelectedCity(city)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                selectedCity === city ? "gradient-purple text-white border-transparent" : "border-border text-muted-foreground hover:border-primary/50 hover:text-white"
              }`}
            >{city}</button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((doctor, idx) => (
            <div key={doctor.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all flex flex-col">
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div
                  className={`relative rounded-xl bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center shrink-0`}
                  style={{ width: 52, height: 52 }}
                >
                  <span className="text-white font-bold text-lg">{getInitials(doctor.name)}</span>
                  {doctor.isOnline && <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-card" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-sm leading-tight">{doctor.name}</h3>
                  <p className="text-primary text-xs mt-0.5 leading-tight">{doctor.specialty}</p>
                  <StarRating rating={doctor.rating} />
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1.5 mb-3">
                <div className="flex items-start gap-2">
                  <MapPin size={11} className="text-primary/60 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground text-xs leading-tight">{doctor.hospital}, {doctor.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity size={11} className="text-primary/60 shrink-0" />
                  <span className="text-muted-foreground text-xs">{doctor.experience} years experience</span>
                  <span className={`ml-auto text-xs font-medium ${doctor.isOnline ? "text-green-400" : "text-muted-foreground"}`}>
                    {doctor.isOnline ? "● Online" : "● Offline"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={11} className="text-primary/60 shrink-0" />
                  <span className="text-muted-foreground text-xs">{doctor.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={11} className="text-primary/60 shrink-0" />
                  <span className="text-muted-foreground text-xs truncate">{doctor.email}</span>
                </div>
              </div>

              {/* Bio */}
              <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-4 flex-1">{doctor.bio}</p>

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-2 mt-auto">
                {/* Message */}
                <button
                  onClick={() => sentActions[`${doctor.id}-msg`] ? null : setMsgModal(doctor)}
                  className={`flex flex-col items-center gap-1.5 py-2.5 rounded-lg border transition-all ${
                    sentActions[`${doctor.id}-msg`]
                      ? "border-green-600/40 bg-green-900/20"
                      : "border-border hover:border-primary hover:bg-primary/10"
                  }`}
                >
                  {sentActions[`${doctor.id}-msg`]
                    ? <CheckCircle size={16} className="text-green-400" />
                    : <MessageCircle size={16} className="text-muted-foreground" />}
                  <span className={`text-xs ${sentActions[`${doctor.id}-msg`] ? "text-green-400" : "text-muted-foreground"}`}>
                    {sentActions[`${doctor.id}-msg`] ? "Sent!" : "Message"}
                  </span>
                </button>

                {/* Call */}
                <button
                  onClick={() => !sentActions[`${doctor.id}-call`] && handleCall(doctor)}
                  className={`flex flex-col items-center gap-1.5 py-2.5 rounded-lg border transition-all ${
                    sentActions[`${doctor.id}-call`]
                      ? "border-green-600/40 bg-green-900/20"
                      : "border-border hover:border-green-500 hover:bg-green-500/10"
                  }`}
                >
                  {sentActions[`${doctor.id}-call`]
                    ? <CheckCircle size={16} className="text-green-400" />
                    : <PhoneCall size={16} className="text-muted-foreground" />}
                  <span className={`text-xs ${sentActions[`${doctor.id}-call`] ? "text-green-400" : "text-muted-foreground"}`}>
                    {sentActions[`${doctor.id}-call`] ? "Sent!" : "Call Req"}
                  </span>
                </button>

                {/* Appointment */}
                <button
                  onClick={() => !sentActions[`${doctor.id}-appt`] && handleAppt(doctor)}
                  className={`flex flex-col items-center gap-1.5 py-2.5 rounded-lg border transition-all ${
                    sentActions[`${doctor.id}-appt`]
                      ? "border-green-600/40 bg-green-900/20"
                      : "border-border hover:border-blue-500 hover:bg-blue-500/10"
                  }`}
                >
                  {sentActions[`${doctor.id}-appt`]
                    ? <CheckCircle size={16} className="text-green-400" />
                    : <Calendar size={16} className="text-muted-foreground" />}
                  <span className={`text-xs ${sentActions[`${doctor.id}-appt`] ? "text-green-400" : "text-muted-foreground"}`}>
                    {sentActions[`${doctor.id}-appt`] ? "Booked!" : "Appt"}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
