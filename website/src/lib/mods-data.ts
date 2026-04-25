export type ModInfo = {
  slug: string;
  name: string;
  description: string;
  category: 'perf' | 'fun' | 'core';
};

export const MODS: ModInfo[] = [
  // core
  {
    slug: 'fabric-api',
    name: 'Fabric API',
    description: 'Базовая зависимость для всех Fabric-модов.',
    category: 'core',
  },
  // perf
  {
    slug: 'lithium',
    name: 'Lithium',
    description: 'Главный мод оптимизации сервера: ИИ мобов, физика, тики — без изменения геймплея.',
    category: 'perf',
  },
  {
    slug: 'ferrite-core',
    name: 'FerriteCore',
    description: 'Уменьшает потребление памяти на 30-50%, особенно при загрузке мира.',
    category: 'perf',
  },
  {
    slug: 'krypton',
    name: 'Krypton',
    description: 'Оптимизирует сетевой стек — меньше лагов и пинга у игроков.',
    category: 'perf',
  },
  {
    slug: 'c2me-fabric',
    name: 'C2ME',
    description: 'Многопоточная генерация и загрузка чанков. Огромный буст для исследования.',
    category: 'perf',
  },
  {
    slug: 'scalablelux',
    name: 'ScalableLux',
    description: 'Многопоточный движок света — меньше лагов при изменении блоков.',
    category: 'perf',
  },
  {
    slug: 'spark',
    name: 'Spark',
    description: 'Профайлер для админов: команда /spark покажет где сервер тратит время.',
    category: 'perf',
  },
  {
    slug: 'servercore',
    name: 'ServerCore',
    description: 'Дополнительные оптимизации поверх Lithium для серверов с большим миром.',
    category: 'perf',
  },
  {
    slug: 'noisium',
    name: 'Noisium',
    description: 'Ускоряет генерацию мира на 20-30%.',
    category: 'perf',
  },
  // fun
  {
    slug: 'carpet',
    name: 'Carpet',
    description: 'Админ-инструменты: тик-варп, fillBiome, изменение правил без перезагрузки.',
    category: 'fun',
  },
  {
    slug: 'fallingtree',
    name: 'FallingTree',
    description: 'Сруби нижний блок — всё дерево падает. Спасает время.',
    category: 'fun',
  },
  {
    slug: 'easy-anvils',
    name: 'Easy Anvils',
    description: 'Снимает дурацкий лимит «too expensive» в наковальне.',
    category: 'fun',
  },
  {
    slug: 'trade-cycling',
    name: 'Trade Cycling',
    description: 'Можно перебрать торговца — больше не надо убивать жителей за хорошие сделки.',
    category: 'fun',
  },
  {
    slug: 'wandering-trades-fabric',
    name: 'Wandering Trades',
    description: 'Странствующий торговец становится полезным: настраиваемый список товаров.',
    category: 'fun',
  },
  {
    slug: 'appleskin',
    name: 'AppleSkin',
    description: 'Показывает реальное насыщение еды и шкалу голода после еды.',
    category: 'fun',
  },
];
