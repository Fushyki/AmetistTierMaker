// Adicione seu email aqui para ter poderes globais de exclusão na Home
export const ADMIN_EMAILS = [
  'daviamaral3284@gmail.com'
];

export const isAdmin = (user) => {
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.includes(user.email);
};
