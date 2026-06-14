export type SkillTestSeedRow = {
  skill: string;
  description: string;
  passThreshold: number;
  questions: Array<{
    question: string;
    options: Array<{ id: string; text: string }>;
    correctOptionId: string;
    sortOrder: number;
  }>;
};

export const SKILL_TESTS_SEED: SkillTestSeedRow[] = [
  {
    skill: 'JavaScript',
    description: 'Базовый тест по JavaScript для стажировок и junior-позиций.',
    passThreshold: 70,
    questions: [
      {
        question: 'Что вернёт typeof null в JavaScript?',
        options: [
          { id: 'a', text: '"object"' },
          { id: 'b', text: '"null"' },
          { id: 'c', text: '"undefined"' },
        ],
        correctOptionId: 'a',
        sortOrder: 0,
      },
      {
        question: 'Какой метод массива создаёт новый массив из результатов функции?',
        options: [
          { id: 'a', text: 'forEach' },
          { id: 'b', text: 'map' },
          { id: 'c', text: 'push' },
        ],
        correctOptionId: 'b',
        sortOrder: 1,
      },
      {
        question: 'Что такое замыкание (closure)?',
        options: [
          { id: 'a', text: 'Функция с доступом к внешней области видимости' },
          { id: 'b', text: 'Способ закрыть вкладку браузера' },
          { id: 'c', text: 'Тип данных в TypeScript' },
        ],
        correctOptionId: 'a',
        sortOrder: 2,
      },
    ],
  },
  {
    skill: 'Excel',
    description: 'Базовые формулы и работа с таблицами.',
    passThreshold: 70,
    questions: [
      {
        question: 'Какая функция суммирует диапазон ячеек?',
        options: [
          { id: 'a', text: 'SUM' },
          { id: 'b', text: 'COUNT' },
          { id: 'c', text: 'AVERAGE' },
        ],
        correctOptionId: 'a',
        sortOrder: 0,
      },
      {
        question: 'Что делает VLOOKUP?',
        options: [
          { id: 'a', text: 'Ищет значение в первом столбце таблицы' },
          { id: 'b', text: 'Сортирует столбец по возрастанию' },
          { id: 'c', text: 'Объединяет две книги' },
        ],
        correctOptionId: 'a',
        sortOrder: 1,
      },
    ],
  },
];
