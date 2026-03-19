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
