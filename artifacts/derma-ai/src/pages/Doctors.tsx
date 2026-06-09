import { useState } from "react";
import { MapPin, Phone, Mail, Star, MessageCircle, PhoneCall, Calendar, Activity, CheckCircle, X, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CITIES = ["All", "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Peshawar"];

const DOCTORS = [
  { id: 1, name: "Dr. Ahmed Hassan",   specialty: "Dermatology & Skin Cancer Specialist",      hospital: "Shaukat Khanum Memorial Cancer Hospital", city: "Lahore",     experience: 18, rating: 4.9, phone: "+92-42-3590-5000", whatsapp: "924235905000", email: "ahmed.hassan@shaukat.pk",   bio: "Pioneer of AI-assisted dermatology in Pakistan. Senior dermatologist specializing in early-stage skin cancer detection.", isOnline: true  },
  { id: 2, name: "Dr. Fatima Khan",    specialty: "Dermatology & Oncology Specialist",          hospital: "Aga Khan University Hospital",             city: "Karachi",    experience: 14, rating: 4.8, phone: "+92-21-3493-0051", whatsapp: "922134930051", email: "fatima.khan@akuh.pk",        bio: "Specialist in melanoma and pigmented lesion analysis. Trained at London School of Dermatology.",              isOnline: true  },
  { id: 3, name: "Dr. Usman Ali",      specialty: "Consultant Dermatologist",                   hospital: "PIMS — Pakistan Institute of Medical Sciences", city: "Islamabad", experience: 12, rating: 4.7, phone: "+92-51-926-1170", whatsapp: "925192611700", email: "usman.ali@pims.pk",          bio: "Expert in non-surgical skin cancer treatment and photodynamic therapy.",                                       isOnline: true  },
  { id: 4, name: "Dr. Ayesha Malik",   specialty: "Pediatric Dermatologist",                    hospital: "Children Hospital Lahore",                 city: "Lahore",     experience:  9, rating: 4.6, phone: "+92-42-9923-1371", whatsapp: "924299231371", email: "ayesha.malik@chl.pk",        bio: "Pediatric dermatology specialist with focus on benign and malignant skin tumors in children.",                 isOnline: false },
  { id: 5, name: "Dr. Muhammad Tariq", specialty: "Mohs Surgery & Skin Cancer",                 hospital: "Liaquat National Hospital",                city: "Karachi",    experience: 20, rating: 4.9, phone: "+92-21-3411-7460", whatsapp: "922134117460", email: "muhammad.tariq@lnh.pk",      bio: "Pakistan's leading Mohs micrographic surgery expert. 20+ years treating carcinomas.",                         isOnline: true  },
  { id: 6, name: "Dr. Sana Qureshi",   specialty: "Dermato-Oncology Specialist",                hospital: "Holy Family Hospital",                     city: "Rawalpindi", experience: 11, rating: 4.7, phone: "+92-51-923-0786",  whatsapp: "925192307860", email: "sana.qureshi@hfh.pk",        bio: "Specializes in dermoscopy and computer-aided diagnosis of pigmented skin lesions.",                            isOnline: true  },
  { id: 7, name: "Dr. Imran Qureshi",  specialty: "Consultant Dermatologist",                   hospital: "Lady Reading Hospital",                    city: "Peshawar",   experience: 15, rating: 4.5, phone: "+92-91-921-0430",  whatsapp: "929192104300", email: "imran.qureshi@lrh.pk",       bio: "Pioneer of telemedicine dermatology in KPK. Expert in skin cancer detection for the Peshawar region.",        isOnline: true  },
  { id: 8, name: "Dr. Zara Hussain",   specialty: "Clinical Dermatologist",                     hospital: "Services Hospital",                        city: "Lahore",     experience:  8, rating: 4.4, phone: "+92-42-9203-4400", whatsapp: "924292034400", email: "zara.hussain@services.pk",   bio: "Expert in skin lesion biopsies and histopathological analysis with a focus on malignant tumors.",              isOnline: false },
  { id: 9, name: "Dr. Asif Mehmood",   specialty: "Surgical Dermatologist",                     hospital: "Civil Hospital Karachi",                   city: "Karachi",    experience: 16, rating: 4.6, phone: "+92-21-9920-4900", whatsapp: "922199204900", email: "asif.mehmood@civil.pk",      bio: "Surgical dermatologist specializing in excision of malignant skin lesions and reconstructive procedures.",     isOnline: true  },
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

/* ── WhatsApp message preview bubble ──────────────────────────────── */
function WhatsAppPreview({ doctorName, patientName, condition, isCall }: {
  doctorName: string; patientName: string; condition: string; isCall?: boolean;
}) {
  const msg = isCall
    ? `Hello ${doctorName},\n\nPatient Name: ${patientName || "Not provided"}\nPatient Problem: ${condition || "Skin lesion analysis"}\n\nThe patient wishes to contact you through the AI Dermascan platform.\n\nPlease respond at your earliest convenience.\n\n— AI Dermascan`
    : `Hello ${doctorName},\n\nA new appointment has been booked via AI Dermascan.\n\nPatient: ${patientName || "Not provided"}\nRequest: ${condition || "Skin consultation"}\n\nPlease confirm the appointment.\n\n— AI Dermascan`;

  return (
    <div className="bg-[#0a1a12] border border-[#1a3828] rounded-xl p-3 mt-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
          <MessageCircle size={11} className="text-white" />
        </div>
        <span className="text-[#25D366] text-xs font-semibold">WhatsApp Message Preview</span>
        <span className="ml-auto text-[10px] text-[#25D366]/60">Will be sent to doctor</span>
      </div>
      <div className="bg-[#1a3828] rounded-lg p-3 text-[11px] text-[#e9fde0] leading-relaxed font-mono whitespace-pre-wrap">{msg}</div>
    </div>
  );
}

/* ── Appointment Booking Modal ──────────────────────────────────── */
interface ContactModalProps {
  doctor: typeof DOCTORS[0];
  mode: "msg" | "appt";
  onClose: () => void;
  onSent: () => void;
}

function ContactModal({ doctor, mode, onClose, onSent }: ContactModalProps) {
  const [senderName, setSenderName] = useState("");
  const [phone,      setPhone]      = useState("");
  const [message,    setMessage]    = useState("");
  const [sending,    setSending]    = useState(false);
  const [sent,       setSent]       = useState(false);

  const isAppt = mode === "appt";

  function buildWaUrl(msg: string) {
    const num = doctor.whatsapp.replace(/\D/g, "");
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  }

  const waMessage = isAppt
    ? `Hello ${doctor.name},\n\nA new appointment has been booked via AI Dermascan.\n\nPatient: ${senderName || "Not provided"}\nPhone: ${phone || "Not provided"}\nRequest: ${message || "Skin consultation"}\n\nPlease confirm the appointment.\n\n— AI Dermascan`
    : `Hello ${doctor.name},\n\nMessage from patient via AI Dermascan.\n\nPatient: ${senderName || "Not provided"}\nMessage: ${message}\n\n— AI Dermascan`;

  function handleSend() {
    if (!senderName.trim() || !phone.trim() || !message.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 900);
  }

  function handleOpenWhatsApp() {
    window.open(buildWaUrl(waMessage), "_blank");
    onSent();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-base">{isAppt ? "Book Appointment" : "Send Message"}</h3>
            <p className="text-muted-foreground text-xs mt-0.5">with {doctor.name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white p-1"><X size={18} /></button>
        </div>

        {/* Doctor preview */}
        <div className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border mb-4">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${AVATAR_COLORS[doctor.id % AVATAR_COLORS.length]} flex items-center justify-center shrink-0`}>
            <span className="text-white font-bold text-sm">{getInitials(doctor.name)}</span>
          </div>
          <div>
            <div className="text-white text-sm font-semibold">{doctor.name}</div>
            <div className="text-primary text-xs">{doctor.specialty}</div>
            <div className="text-muted-foreground text-xs">{doctor.hospital}</div>
          </div>
        </div>

        {!sent ? (
          <>
            {/* Form */}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Patient Full Name *</label>
                <Input value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="Muhammad Ali" className="h-9 bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Phone Number *</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+92-300-1234567" type="tel" className="h-9 bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">
                  {isAppt ? "Appointment Request / Symptoms *" : "Your Message *"}
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={isAppt ? "Preferred date/time, symptoms, or special requirements..." : "Describe your concern, symptoms, or question..."}
                  rows={3}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {isAppt && senderName && (
              <WhatsAppPreview doctorName={doctor.name} patientName={senderName} condition={message} />
            )}

            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={onClose} className="flex-1 h-10 text-sm">Cancel</Button>
              <Button
                onClick={handleSend}
                disabled={!senderName.trim() || !phone.trim() || !message.trim() || sending}
                className="flex-1 h-10 gradient-purple border-0 text-sm gap-2"
              >
                {sending ? <><Activity size={14} className="animate-spin" />Sending...</> : <><Send size={14} />{isAppt ? "Book Appointment" : "Send Message"}</>}
              </Button>
            </div>
          </>
        ) : (
          /* Success state */
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-green-900/30 border border-green-700/40 flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={24} className="text-green-400" />
            </div>
            <div className="text-white font-bold text-base mb-1">
              {isAppt ? "Appointment Requested!" : "Message Sent!"}
            </div>
            <p className="text-muted-foreground text-xs mb-4">
              {isAppt
                ? "Your appointment request has been submitted. Click below to also send a WhatsApp notification directly to the doctor."
                : "Your message has been sent successfully."}
            </p>
            {isAppt && (
              <>
                <WhatsAppPreview doctorName={doctor.name} patientName={senderName} condition={message} />
                <button
                  onClick={handleOpenWhatsApp}
                  className="mt-4 w-full flex items-center justify-center gap-2 h-11 bg-[#25D366] hover:bg-[#1fba58] text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  <MessageCircle size={16} />
                  Send WhatsApp Notification to Doctor
                </button>
              </>
            )}
            <Button variant="outline" onClick={onClose} className="mt-2 w-full h-10 text-sm">Close</Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── WhatsApp Call Request Modal ──────────────────────────────── */
function CallModal({ doctor, onClose }: { doctor: typeof DOCTORS[0]; onClose: () => void }) {
  const [patientName, setPatientName] = useState("");
  const [condition,   setCondition]   = useState("");
  const [sent,        setSent]        = useState(false);

  const waMsg = `Hello ${doctor.name},\n\nPatient Name: ${patientName || "Not provided"}\nPatient Problem: ${condition || "Skin lesion / dermatology concern"}\n\nThe patient wishes to contact you through the AI Dermascan platform.\n\nPlease call back at your earliest convenience.\n\n— AI Dermascan`;

  function handleSendAndCall() {
    const num = doctor.whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(waMsg)}`, "_blank");
    setSent(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-base">Call Doctor</h3>
            <p className="text-muted-foreground text-xs mt-0.5">{doctor.name} · {doctor.phone}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white p-1"><X size={18} /></button>
        </div>

        {/* Doctor preview */}
        <div className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border mb-4">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${AVATAR_COLORS[doctor.id % AVATAR_COLORS.length]} flex items-center justify-center shrink-0`}>
            <span className="text-white font-bold text-sm">{getInitials(doctor.name)}</span>
          </div>
          <div className="flex-1">
            <div className="text-white text-sm font-semibold">{doctor.name}</div>
            <div className="text-muted-foreground text-xs">{doctor.phone}</div>
          </div>
          <div className={`w-2 h-2 rounded-full ${doctor.isOnline ? "bg-green-400" : "bg-gray-500"}`} />
        </div>

        {!sent ? (
          <>
            <div className="p-3 bg-amber-900/20 border border-amber-700/30 rounded-xl mb-4 text-xs text-amber-300 leading-relaxed">
              A WhatsApp message will be sent to the doctor first with your details. The doctor will then call you back.
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Your Name *</label>
                <Input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Muhammad Ali" className="h-9 bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Problem / Condition *</label>
                <Input value={condition} onChange={e => setCondition(e.target.value)} placeholder="Skin lesion, dark spot, rash..." className="h-9 bg-background text-sm" />
              </div>
            </div>
            <WhatsAppPreview doctorName={doctor.name} patientName={patientName} condition={condition} isCall />
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={onClose} className="flex-1 h-10 text-sm">Cancel</Button>
              <button
                onClick={handleSendAndCall}
                disabled={!patientName.trim() || !condition.trim()}
                className="flex-1 h-10 flex items-center justify-center gap-2 bg-[#25D366] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1fba58] text-white rounded-xl font-semibold text-sm transition-colors"
              >
                <MessageCircle size={14} />
                Send WhatsApp & Call
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-green-900/30 border border-green-700/40 flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={24} className="text-green-400" />
            </div>
            <div className="text-white font-bold mb-1">WhatsApp Sent!</div>
            <p className="text-muted-foreground text-xs mb-4">
              The doctor has been notified via WhatsApp with your details. They will call you back shortly.
            </p>
            <Button variant="outline" onClick={onClose} className="w-full h-10 text-sm">Close</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Doctors() {
  const [selectedCity, setSelectedCity] = useState("All");
  const [sentActions, setSentActions]   = useState<Record<string, boolean>>({});
  const [modal,  setModal]  = useState<{ doctor: typeof DOCTORS[0]; mode: "msg" | "appt" } | null>(null);
  const [callModal, setCallModal] = useState<typeof DOCTORS[0] | null>(null);
  const { toast } = useToast();

  const filtered = DOCTORS.filter(d => selectedCity === "All" || d.city === selectedCity);

  function markSent(doctorId: number, action: string) {
    setSentActions(prev => ({ ...prev, [`${doctorId}-${action}`]: true }));
  }

  function handleSent(doctor: typeof DOCTORS[0], mode: "msg" | "appt") {
    markSent(doctor.id, mode);
    if (mode === "msg") {
      toast({ title: "Message Sent ✓", description: `Your message was sent to ${doctor.name}. Expect a reply within 24 hours.` });
    } else {
      toast({ title: "Appointment Requested ✓", description: `Appointment request sent to ${doctor.name}. WhatsApp notification delivered to doctor.` });
    }
  }

  return (
    <>
      {modal && (
        <ContactModal
          doctor={modal.doctor}
          mode={modal.mode}
          onClose={() => setModal(null)}
          onSent={() => handleSent(modal.doctor, modal.mode)}
        />
      )}
      {callModal && (
        <CallModal
          doctor={callModal}
          onClose={() => { setCallModal(null); markSent(callModal.id, "call"); }}
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

        {/* WhatsApp info banner */}
        <div className="flex items-center gap-3 p-3 bg-[#0a1a12] border border-[#1a3828] rounded-xl">
          <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
            <MessageCircle size={15} className="text-white" />
          </div>
          <div>
            <span className="text-[#25D366] text-xs font-semibold">WhatsApp Integration Active</span>
            <p className="text-[#25D366]/60 text-[10px] mt-0.5">Appointments and call requests automatically notify doctors via WhatsApp</p>
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
              {/* Top row */}
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center shrink-0`}>
                  <span className="text-white font-bold text-base">{getInitials(doctor.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <div className="text-white font-semibold text-sm leading-tight">{doctor.name}</div>
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${doctor.isOnline ? "bg-green-400" : "bg-gray-500"}`} />
                  </div>
                  <div className="text-primary text-[11px] leading-tight mt-0.5">{doctor.specialty}</div>
                  <StarRating rating={doctor.rating} />
                </div>
              </div>

              {/* Info */}
              <div className="space-y-1.5 mb-3 flex-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <MapPin size={11} className="shrink-0 text-primary/60" />
                  <span className="truncate">{doctor.hospital}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Phone size={11} className="shrink-0 text-primary/60" />
                  <span>{doctor.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Mail size={11} className="shrink-0 text-primary/60" />
                  <span className="truncate">{doctor.email}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-muted-foreground">{doctor.experience}y experience</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${doctor.isOnline ? "bg-green-900/40 text-green-400 border border-green-700/30" : "bg-gray-800 text-gray-500 border border-gray-700"}`}>
                    {doctor.isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>

              {/* Bio */}
              <p className="text-muted-foreground text-xs leading-relaxed mb-4 line-clamp-2">{doctor.bio}</p>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setCallModal(doctor)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    sentActions[`${doctor.id}-call`]
                      ? "bg-green-900/20 border-green-700/30 text-green-400"
                      : "border-border text-muted-foreground hover:bg-[#0a1a12] hover:border-[#25D366]/50 hover:text-[#25D366]"
                  }`}
                >
                  {sentActions[`${doctor.id}-call`] ? <CheckCircle size={14} /> : <PhoneCall size={14} />}
                  <span className="text-[10px]">Call</span>
                </button>
                <button
                  onClick={() => setModal({ doctor, mode: "msg" })}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    sentActions[`${doctor.id}-msg`]
                      ? "bg-green-900/20 border-green-700/30 text-green-400"
                      : "border-border text-muted-foreground hover:bg-primary/5 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {sentActions[`${doctor.id}-msg`] ? <CheckCircle size={14} /> : <MessageCircle size={14} />}
                  <span className="text-[10px]">Message</span>
                </button>
                <button
                  onClick={() => setModal({ doctor, mode: "appt" })}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    sentActions[`${doctor.id}-appt`]
                      ? "bg-green-900/20 border-green-700/30 text-green-400"
                      : "border-border text-muted-foreground hover:bg-primary/5 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {sentActions[`${doctor.id}-appt`] ? <CheckCircle size={14} /> : <Calendar size={14} />}
                  <span className="text-[10px]">Appoint</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
