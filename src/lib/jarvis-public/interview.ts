import type { InterviewNote } from './dossier'

/**
 * Interview answers approved by Matheus, in the first person and in Portuguese.
 *
 * Provenance: drafted on 2026-11-13 from what he already publishes on this
 * site and from his own earlier statements, then approved by him. They are
 * not a transcript.
 *
 * This repository is PUBLIC: anything added here is published on push.
 * Add an answer only after he has read and approved its exact text. Do not
 * add company numbers, personal details or other people's names.
 */
export const interviewNotes: InterviewNote[] = [
  {
    question: 'Como você decide o que entra e o que fica de fora com várias frentes ao mesmo tempo?',
    answer:
      'Separo o trabalho por frente e mantenho cada uma com o seu próprio contexto. Também mantenho uma lista do que deixo de fazer de propósito: hoje, consultoria paralela, redes sociais novas e palestras. O que dá para rodar em paralelo eu delego.',
  },
  {
    question: 'Onde você anota uma ideia e quando ela vira projeto?',
    answer:
      'Penso falando e rabiscando. A ideia vai para um caderno e para a memória do Jarvis, junto com o contexto do projeto, e eu recupero depois em qualquer conversa. Vira projeto quando passa a ter execução: aí ganha um registro próprio, com critério de aceite.',
  },
  {
    question: 'O que você delega para agentes de IA e o que não delega?',
    answer:
      'Delego execução: implementação, varredura, revisão e trabalho de volume, de preferência em paralelo e com cada agente isolado no seu espaço. Decisão fica comigo: merge, deploy, gasto e qualquer coisa enviada em meu nome.',
  },
  {
    question: 'O que faz você confiar que um trabalho feito por IA está pronto?',
    answer:
      'Peço evidência: o que foi medido e o que ficou sem medir. Gosto de uma revisão independente de quem fez o trabalho. Build passando e aprovação minha contam pouco sem teste de verdade.',
  },
  {
    question: 'Por que construir o Jarvis em vez de usar algo pronto?',
    answer:
      'Minha prioridade é preservar minhas informações, meu histórico e meu contexto. Ferramenta eu troco sem apego. O Jarvis guarda isso num lugar meu e deixa acessível entre conversas e projetos, com limite claro do que ele pode fazer sozinho.',
  },
]
