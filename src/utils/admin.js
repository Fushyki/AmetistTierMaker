// Carrega e-mails de administradores com segurança via variáveis de ambiente
const getAdminEmails = () => {
  const envAdmins = import.meta.env.VITE_ADMIN_EMAILS || '';
  return envAdmins
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
};

export const isAdmin = (user) => {
  if (!user || !user.email) return false;
  const adminList = getAdminEmails();
  return adminList.includes(user.email.trim().toLowerCase());
};

