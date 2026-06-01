export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Pitch {
  id: string;
  name: string;
  location: string;
  pricePerHour: number;
}

export type SlotStatus = "available" | "reserved" | "booked";

export interface SlotAvailability {
  id: string;
  pitchId: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
}

export interface AvailabilityResponse {
  pitchId: string;
  date: string;
  slots: SlotAvailability[];
}

export interface Booking {
  id: string;
  userId: string;
  pitchId: string;
  slotId: string;
  bookingDate: string;
  status: "CONFIRMED" | "CANCELLED";
  createdAt: string;
  pitch?: { id: string; name: string; location: string };
  slot?: { id: string; startTime: string; endTime: string };
}

export interface SlotEventPayload {
  pitchId: string;
  slotId: string;
  date: string;
  status: SlotStatus;
}
