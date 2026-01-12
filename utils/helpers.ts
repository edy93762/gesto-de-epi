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

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const calculateStatus = (predictedDate: string): 'VENCIDO' | 'A VENCER' | 'OK' => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(predictedDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'VENCIDO';
  if (diffDays <= 15) return 'A VENCER';
  return 'OK';
};