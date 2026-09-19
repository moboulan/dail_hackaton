// The quiz a pharmacist gets: the 3 questions the Bilan wrote on their own mistakes, or the
// module's fixed questions when the Bilan had none (nothing missed, or a malformed answer).

export function quizQuestions(module, progress) {
  const personal = progress.debrief?.quiz;
  return Array.isArray(personal) && personal.length === 3 ? personal : module.quiz;
}

export function quizScore(questions, answers) {
  const right = questions.filter((q) => answers[q.id] === q.correct).length;
  return Math.round((right / questions.length) * 100);
}
