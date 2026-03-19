export type Contact = {
  name: string;
  email: string;
  position: string;
  company: string;
};

export type Campaign = {
  id: string;
  name: string;
  subject: string;
  body: string;
  contacts: Contact[];
  createdAt: string;
};

export type StoredContact = {
  id: string;
  name: string;
  email: string;
  position: string;
  company: string;
  notes: string;
  createdAt: string;
};

export type EmailRecord = {
  id: string;
  contactEmail: string;
  subject: string;
  body: string;
  sentAt: string;
  campaignId?: string;
  campaignName?: string;
};
