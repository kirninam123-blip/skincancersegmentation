import { useState } from "react";
import { useListDoctors, getListDoctorsQueryKey } from "@workspace/api-client-react";
import { MapPin, Phone, Mail, Star, MessageCircle, PhoneCall, Calendar, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const CITIES = ["All", "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Peshawar"];

const FALLBACK_DOCTORS = [
  { id: 1, name: "Dr. Ahmed Hassan", specialty: "Dermatology & Skin Cancer Specialist", hospital: "Shaukat Khanum Memorial Cancer Hospital", city: "Lahore", country: "Pakistan", experience: 18, rating: 4.9, phone: "+92-42-3590-5000", email: "ahmed.hassan@shaukat.pk", bio: "Senior dermatologist specializing in early-stage skin cancer detection. Pioneer of AI-assisted dermatology in Pakistan.", isOnline: true },
  { id: 2, name: "Dr. Fatima Khan", specialty: "Dermatology & Oncology Specialist", hospital: "Aga Khan University Hospital", city: "Karachi", country: "Pakistan", experience: 14, rating: 4.8, phone: "+92-21-3493-0051", email: "fatima.khan@akuh.pk", bio: "Specialist in melanoma and pigmented lesion analysis. Trained at London School of Dermatology.", isOnline: true },
  { id: 3, name: "Dr. Usman Ali", specialty: "Consultant Dermatologist", hospital: "Pakistan Institute of Medical Sciences (PIMS)", city: "Islamabad", country: "Pakistan", experience: 12, rating: 4.7, phone: "+92-51-926-1170", email: "usman.ali@pims.pk", bio: "Expert in non-surgical skin cancer treatment and photodynamic therapy.", isOnline: true },
  { id: 4, name: "Dr. Ayesha Malik", specialty: "Pediatric Dermatologist", hospital: "Children Hospital Lahore", city: "Lahore", country: "Pakistan", experience: 9, rating: 4.6, phone: "+92-42-9923-1371", email: "ayesha.malik@chl.pk", bio: "Pediatric dermatology specialist with focus on benign and malignant skin tumors in children.", isOnline: false },
  { id: 5, name: "Dr. Muhammad Tariq", specialty: "Mohs Surgery & Skin Cancer", hospital: "Liaquat National Hospital", city: "Karachi", country: "Pakistan", experience: 20, rating: 4.9, phone: "+92-21-3411-7460", email: "muhammad.tariq@lnh.pk", bio: "Pakistan leading Mohs micrographic surgery expert. 20+ years treating basal cell and squamous cell carcinomas.", isOnline: true },
  { id: 6, name: "Dr. Sana Qureshi", specialty: "Dermato-Oncology Specialist", hospital: "Holy Family Hospital", city: "Rawalpindi", country: "Pakistan", experience: 11, rating: 4.7, phone: "+92-51-923-0786", email: "sana.qureshi@hfh.pk", bio: "Specializes in dermoscopy and computer-aided diagnosis of pigmented skin lesions.", isOnline: true },
  { id: 7, name: "Dr. Imran Qureshi", specialty: "Consultant Dermatologist", hospital: "Lady Reading Hospital", city: "Peshawar", country: "Pakistan", experience: 15, rating: 4.5, phone: "+92-91-921-0430", email: "imran.qureshi@lrh.pk", bio: "Expert in skin cancer detection and treatment for KPK region. Pioneer of telemedicine dermatology.", isOnline: true },
  { id: 8, name: "Dr. Zara Hussain", specialty: "Clinical Dermatologist", hospital: "Services Hospital", city: "Lahore", country: "Pakistan", experience: 8, rating: 4.4, phone: "+92-42-9203-4400", email: "zara.hussain@services.pk", bio: "Clinical dermatologist specializing in skin lesion biopsies and histopathological analysis.", isOnline: false },
  { id: 9, name: "Dr. Asif Mehmood", specialty: "Surgical Dermatologist", hospital: "Civil Hospital Karachi", city: "Karachi", country: "Pakistan", experience: 16, rating: 4.6, phone: "+92-21-9920-4900", email: "asif.mehmood@civil.pk", bio: "Surgical dermatologist with expertise in excision of malignant skin lesions and reconstructive procedures.", isOnline: true },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={12} className={`${i < Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : i < rating ? "text-yellow-400" : "text-gray-600"}`} />
      ))}
      <span className="text-yellow-400 text-xs ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function getInitials(name: string) {
  const parts = name.split(" ");
  return parts.slice(1, 3).map((p: string) => p[0]).join("") || name.slice(0, 2);
}

const AVATAR_COLORS = [
  "from-purple-600 to-indigo-700",
  "from-blue-600 to-cyan-700",
  "from-green-600 to-teal-700",
  "from-orange-600 to-red-700",
  "from-pink-600 to-rose-700",
  "from-yellow-600 to-orange-700",
];

export default function Doctors() {
  const [selectedCity, setSelectedCity] = useState("All");
  const { data: apiDoctors, isLoading } = useListDoctors(
    { city: selectedCity === "All" ? undefined : selectedCity },
    { query: { queryKey: getListDoctorsQueryKey({ city: selectedCity === "All" ? undefined : selectedCity }) } }
  );

  const doctors = (apiDoctors && apiDoctors.length > 0 ? apiDoctors : FALLBACK_DOCTORS).filter(d =>
    selectedCity === "All" || d.city === selectedCity
  );

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pakistani Doctors</h1>
          <p className="text-muted-foreground text-sm">Top dermatologists and skin cancer specialists across Pakistan</p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
          <Users size={16} className="text-primary" />
          <span className="text-white text-sm font-semibold">{doctors.length} Doctors</span>
        </div>
      </div>

      {/* City filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {CITIES.map(city => (
          <button
            key={city}
            onClick={() => setSelectedCity(city)}
            data-testid={`filter-city-${city.toLowerCase()}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${selectedCity === city ? "gradient-purple text-white border-transparent" : "border-border text-muted-foreground hover:border-primary/50 hover:text-white"}`}
          >
            {city}
          </button>
        ))}
      </div>

      {/* Doctors Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {doctors.map((doctor: any, idx: number) => (
            <div key={doctor.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all hover:shadow-lg group" data-testid={`doctor-card-${doctor.id}`}>
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center shrink-0 relative`}>
                  <span className="text-white font-bold text-lg">{getInitials(doctor.name)}</span>
                  {doctor.isOnline && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-card"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-sm leading-tight">{doctor.name}</h3>
                  <p className="text-primary text-xs mt-0.5">{doctor.specialty}</p>
                  <StarRating rating={doctor.rating} />
                </div>
              </div>

              {/* Details */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin size={12} className="shrink-0 mt-0.5 text-primary/60" />
                  <span className="truncate">{doctor.hospital}, {doctor.city}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Activity size={12} className="shrink-0 text-primary/60" />
                  <span>{doctor.experience} years experience</span>
                </div>
                {doctor.phone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone size={12} className="shrink-0 text-primary/60" />
                    <span>{doctor.phone}</span>
                  </div>
                )}
                {doctor.email && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail size={12} className="shrink-0 text-primary/60" />
                    <span className="truncate">{doctor.email}</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {doctor.bio && (
                <p className="mt-3 text-muted-foreground text-xs leading-relaxed line-clamp-2">{doctor.bio}</p>
              )}

              {/* Actions */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button className="flex flex-col items-center gap-1 py-2 rounded-lg border border-border hover:border-primary hover:bg-primary/10 transition-all group" data-testid={`button-message-${doctor.id}`}>
                  <MessageCircle size={16} className="text-muted-foreground group-hover:text-primary" />
                  <span className="text-muted-foreground group-hover:text-primary text-xs">Message</span>
                </button>
                <button className="flex flex-col items-center gap-1 py-2 rounded-lg border border-border hover:border-green-500 hover:bg-green-500/10 transition-all group" data-testid={`button-call-${doctor.id}`}>
                  <PhoneCall size={16} className="text-muted-foreground group-hover:text-green-400" />
                  <span className="text-muted-foreground group-hover:text-green-400 text-xs">Call Req</span>
                </button>
                <button className="flex flex-col items-center gap-1 py-2 rounded-lg border border-border hover:border-blue-500 hover:bg-blue-500/10 transition-all group" data-testid={`button-appt-${doctor.id}`}>
                  <Calendar size={16} className="text-muted-foreground group-hover:text-blue-400" />
                  <span className="text-muted-foreground group-hover:text-blue-400 text-xs">Appt</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Activity({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  );
}
