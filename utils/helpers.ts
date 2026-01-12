
export const generateId = (prefix: string = 'ID'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};
