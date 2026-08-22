export function getUserDisplayName(user) {
  if (!user) return 'Anonyme';
  
  if (user.displayPreference === 'PSEUDO' && user.pseudo) {
    return user.pseudo;
  }
  
  const firstName = user.firstName || user.name?.split(' ')[0] || '';
  const lastName = user.lastName || '';
  
  const fullName = `${firstName} ${lastName}`.trim();
  
  if (!fullName) {
    return user.pseudo || 'Anonyme';
  }
  
  return fullName;
}
