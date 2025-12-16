// Validador de contatos para vagas
// Usado nas ferramentas de postagem para garantir que toda vaga tenha contato

const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const phoneRegex = /\(?[0-9]{2}\)?[\s-]?[0-9]{4,5}[\s-]?[0-9]{4}/;
const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+/;

export function hasValidContact(jobData) {
  // Verificar se tem descrição
  if (!jobData.description || jobData.description.trim().length < 10) {
    return false;
  }

  const fullText = `${jobData.description || ''} ${jobData.additional_info || ''} ${jobData.application_link || ''}`.toLowerCase();
  
  // Verificar application_link
  if (jobData.application_link && urlRegex.test(jobData.application_link)) {
    return true;
  }
  
  // Verificar email, telefone ou site no texto
  return emailRegex.test(fullText) || 
         phoneRegex.test(fullText) || 
         urlRegex.test(fullText);
}

export function getContactValidationMessage() {
  return 'Esta vaga precisa ter uma descrição (mínimo 10 caracteres) e pelo menos uma forma de contato (email, telefone, site ou link).';
}