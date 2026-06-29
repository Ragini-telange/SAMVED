export interface Comment {
  author: string;
  text: string;
  createdAt: string;
}

export interface OfficialUpdate {
  officer: string;
  status: string;
  text: string;
  createdAt: string;
}

export interface Issue {
  id: string;
  title: string;
  type: string;
  description: string;
  severity: number;
  status: "Reported" | "Verified" | "In Progress" | "Resolved";
  location: {
    lat: number;
    lng: number;
    address: string;
    ward: string;
  };
  imageUrl?: string;
  reportedBy: string;
  assignedDepartment: string;
  impactPrediction: string;
  evidenceConfidence: number;
  detectedObjects: string[];
  votes: number;
  votedUsers: string[];
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
  officialUpdates: OfficialUpdate[];
  resolutionSuggestions?: string[];
  disasterAlert?: string;
}

export type UserRole = "Citizen" | "Officer" | "Admin";

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  points: number;
  badge: string;
  avatar: string;
}

export interface DisasterAlert {
  id: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "WARNING";
  description: string;
  timestamp: string;
  affectedWards: string[];
  suggestedPrecautions: string[];
}

export interface Prediction {
  title: string;
  area: string;
  vulnerability: string;
  trigger: string;
  severity: number;
  mitigation: string;
}
