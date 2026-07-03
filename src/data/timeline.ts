type LocalizedText = {
  en: string;
  ru: string;
};

export type TimelineItem = {
  date: string;
  era: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
};

export const rulers: TimelineItem[] = [
  {
    date: "c. 500-800",
    era: { en: "Before Rus'", ru: "До Руси" },
    title: { en: "Slavic tribal worlds", ru: "Славянские племенные союзы" },
    description: {
      en: "Eastern Slavic groups, Finnic peoples, steppe powers, and trade elites shaped the region before a named Rus' polity appeared.",
      ru: "Восточнославянские группы, финно-угорские народы, степные державы и торговая знать формировали регион до появления государства Русь.",
    },
  },
  {
    date: "862-879",
    era: { en: "Early Rus'", ru: "Ранняя Русь" },
    title: { en: "Rurik", ru: "Рюрик" },
    description: {
      en: "Traditionally treated as the founder of the Rurikid line at Novgorod, though the details mix history and later chronicle tradition.",
      ru: "Традиционно считается основателем династии Рюриковичей в Новгороде, хотя детали соединяют историю и позднюю летописную традицию.",
    },
  },
  {
    date: "879-912",
    era: { en: "Kyivan Rus'", ru: "Киевская Русь" },
    title: { en: "Oleg the Wise", ru: "Олег Вещий" },
    description: {
      en: "Moved the political center toward Kyiv and linked northern river routes with Black Sea trade.",
      ru: "Перенес политический центр к Киеву и связал северные речные пути с черноморской торговлей.",
    },
  },
  {
    date: "980-1015",
    era: { en: "Kyivan Rus'", ru: "Киевская Русь" },
    title: { en: "Vladimir the Great", ru: "Владимир Великий" },
    description: {
      en: "His reign is tied to the Christianization of Rus' and the consolidation of Kyiv's authority.",
      ru: "Его правление связано с крещением Руси и укреплением власти Киева.",
    },
  },
  {
    date: "1019-1054",
    era: { en: "Kyivan Rus'", ru: "Киевская Русь" },
    title: { en: "Yaroslav the Wise", ru: "Ярослав Мудрый" },
    description: {
      en: "Associated with dynastic diplomacy, church building, and the legal tradition remembered as Russkaya Pravda.",
      ru: "Связан с династической дипломатией, церковным строительством и правовой традицией Русской Правды.",
    },
  },
  {
    date: "1238-1263",
    era: { en: "Fragmented Rus'", ru: "Раздробленная Русь" },
    title: { en: "Alexander Nevsky", ru: "Александр Невский" },
    description: {
      en: "Prince of Novgorod and Vladimir, remembered for western battles and pragmatic relations with the Mongol Golden Horde.",
      ru: "Князь Новгородский и Владимирский, известный западными битвами и прагматичными отношениями с Золотой Ордой.",
    },
  },
  {
    date: "1359-1389",
    era: { en: "Rise of Moscow", ru: "Возвышение Москвы" },
    title: { en: "Dmitry Donskoy", ru: "Дмитрий Донской" },
    description: {
      en: "Won the Battle of Kulikovo, a symbolic milestone in Moscow's claim to lead the Rus' lands.",
      ru: "Победил в Куликовской битве, ставшей символическим рубежом в претензии Москвы на лидерство русских земель.",
    },
  },
  {
    date: "1462-1505",
    era: { en: "Muscovy", ru: "Московское государство" },
    title: { en: "Ivan III the Great", ru: "Иван III Великий" },
    description: {
      en: "Gathered lands around Moscow, ended effective Horde overlordship, and adopted imperial court symbolism.",
      ru: "Собирал земли вокруг Москвы, положил конец фактической зависимости от Орды и принял имперскую придворную символику.",
    },
  },
  {
    date: "1533-1584",
    era: { en: "Tsardom", ru: "Царство" },
    title: { en: "Ivan IV the Terrible", ru: "Иван IV Грозный" },
    description: {
      en: "First crowned tsar; expanded into Kazan and Astrakhan while leaving a legacy of terror through the oprichnina.",
      ru: "Первый венчанный царь; расширил владения на Казань и Астрахань, но оставил наследие террора через опричнину.",
    },
  },
  {
    date: "1613-1645",
    era: { en: "Romanovs", ru: "Романовы" },
    title: { en: "Michael Romanov", ru: "Михаил Романов" },
    description: {
      en: "Chosen after the Time of Troubles, beginning the Romanov dynasty.",
      ru: "Избран после Смутного времени и положил начало династии Романовых.",
    },
  },
  {
    date: "1682-1725",
    era: { en: "Empire", ru: "Империя" },
    title: { en: "Peter the Great", ru: "Петр Великий" },
    description: {
      en: "Reformed state institutions, built Saint Petersburg, and proclaimed the Russian Empire in 1721.",
      ru: "Реформировал государственные институты, основал Санкт-Петербург и провозгласил Российскую империю в 1721 году.",
    },
  },
  {
    date: "1762-1796",
    era: { en: "Empire", ru: "Империя" },
    title: { en: "Catherine the Great", ru: "Екатерина Великая" },
    description: {
      en: "Expanded imperial territory, patronized Enlightenment culture, and tightened noble privilege and serfdom.",
      ru: "Расширила территорию империи, поддерживала культуру Просвещения и усилила дворянские привилегии и крепостничество.",
    },
  },
  {
    date: "1855-1881",
    era: { en: "Late Empire", ru: "Поздняя империя" },
    title: { en: "Alexander II", ru: "Александр II" },
    description: {
      en: "Known for the emancipation of the serfs and broad reforms after the Crimean War.",
      ru: "Известен отменой крепостного права и широкими реформами после Крымской войны.",
    },
  },
  {
    date: "1894-1917",
    era: { en: "Late Empire", ru: "Поздняя империя" },
    title: { en: "Nicholas II", ru: "Николай II" },
    description: {
      en: "The last emperor, whose reign ended amid war, revolution, and imperial collapse.",
      ru: "Последний император, чье правление завершилось войной, революцией и крахом империи.",
    },
  },
  {
    date: "1917-1924",
    era: { en: "Soviet state", ru: "Советское государство" },
    title: { en: "Vladimir Lenin", ru: "Владимир Ленин" },
    description: {
      en: "Led the Bolshevik seizure of power and the creation of the Soviet state.",
      ru: "Возглавил приход большевиков к власти и создание советского государства.",
    },
  },
  {
    date: "1924-1953",
    era: { en: "USSR", ru: "СССР" },
    title: { en: "Joseph Stalin", ru: "Иосиф Сталин" },
    description: {
      en: "Centralized power, drove industrialization, imposed mass repression, and led the USSR through World War II.",
      ru: "Централизовал власть, провел индустриализацию, осуществил массовые репрессии и руководил СССР во Второй мировой войне.",
    },
  },
  {
    date: "1985-1991",
    era: { en: "USSR", ru: "СССР" },
    title: { en: "Mikhail Gorbachev", ru: "Михаил Горбачев" },
    description: {
      en: "Perestroika and glasnost opened reform but accelerated the Soviet Union's dissolution.",
      ru: "Перестройка и гласность открыли реформы, но ускорили распад Советского Союза.",
    },
  },
  {
    date: "1991-1999",
    era: { en: "Russian Federation", ru: "Российская Федерация" },
    title: { en: "Boris Yeltsin", ru: "Борис Ельцин" },
    description: {
      en: "First president of the Russian Federation, presiding over post-Soviet transition and constitutional crisis.",
      ru: "Первый президент Российской Федерации, правивший в период постсоветского перехода и конституционного кризиса.",
    },
  },
  {
    date: "2012-present",
    era: { en: "Russian Federation", ru: "Российская Федерация" },
    title: { en: "Vladimir Putin", ru: "Владимир Путин" },
    description: {
      en: "Returned to the presidency; the era includes Crimea's annexation, constitutional changes, and the full-scale war in Ukraine.",
      ru: "Вернулся на пост президента; эпоха включает аннексию Крыма, конституционные изменения и полномасштабную войну в Украине.",
    },
  },
];

export const events: TimelineItem[] = [
  {
    date: "c. 500-700",
    era: { en: "Origins", ru: "Истоки" },
    title: { en: "Eastern Slavic settlement expands", ru: "Расширение расселения восточных славян" },
    description: {
      en: "Slavic-speaking communities spread through forest, steppe-edge, and river systems later central to Rus' history.",
      ru: "Славяноязычные общины распространялись по лесным, лесостепным и речным зонам, позднее ключевым для истории Руси.",
    },
  },
  {
    date: "c. 700-830",
    era: { en: "Origins", ru: "Истоки" },
    title: { en: "River trade before Rus'", ru: "Речная торговля до Руси" },
    description: {
      en: "Baltic, Volga, Dnieper, Khazar, Byzantine, Slavic, and Norse networks connected the region before stable state names.",
      ru: "Балтийские, волжские, днепровские, хазарские, византийские, славянские и скандинавские сети связывали регион до устойчивых государственных названий.",
    },
  },
  {
    date: "839-860s",
    era: { en: "Early Rus'", ru: "Ранняя Русь" },
    title: { en: "Rus' appears in external sources", ru: "Русь появляется во внешних источниках" },
    description: {
      en: "Foreign accounts begin referring to people called Rus', before a unified Russia existed.",
      ru: "Иностранные свидетельства начинают упоминать людей, называемых русью, задолго до существования единой России.",
    },
  },
  {
    date: "882",
    era: { en: "Kyivan Rus'", ru: "Киевская Русь" },
    title: { en: "Kyiv becomes a political center", ru: "Киев становится политическим центром" },
    description: {
      en: "Chronicle tradition places Oleg's seizure of Kyiv at the heart of the emerging Rus' realm.",
      ru: "Летописная традиция связывает захват Киева Олегом с формированием ядра Руси.",
    },
  },
  {
    date: "988",
    era: { en: "Kyivan Rus'", ru: "Киевская Русь" },
    title: { en: "Christianization of Rus'", ru: "Крещение Руси" },
    description: {
      en: "The adoption of Byzantine Christianity reshaped law, culture, diplomacy, and written tradition.",
      ru: "Принятие византийского христианства изменило право, культуру, дипломатию и письменную традицию.",
    },
  },
  {
    date: "1237-1240",
    era: { en: "Mongol invasion", ru: "Монгольское нашествие" },
    title: { en: "Mongol conquest of Rus'", ru: "Монгольское завоевание Руси" },
    description: {
      en: "The invasion devastated many Rus' cities and placed surviving principalities under Horde tribute and politics.",
      ru: "Нашествие разорило многие города Руси и поставило уцелевшие княжества в зависимость от дани и политики Орды.",
    },
  },
  {
    date: "1380",
    era: { en: "Rise of Moscow", ru: "Возвышение Москвы" },
    title: { en: "Battle of Kulikovo", ru: "Куликовская битва" },
    description: {
      en: "Moscow-led forces defeated Mamai's army, strengthening Moscow's prestige even before Horde power fully receded.",
      ru: "Войска во главе с Москвой победили армию Мамая, усилив престиж Москвы еще до окончательного ослабления Орды.",
    },
  },
  {
    date: "1480",
    era: { en: "Muscovy", ru: "Московское государство" },
    title: { en: "Stand on the Ugra", ru: "Стояние на Угре" },
    description: {
      en: "The standoff is commonly treated as the end of effective Mongol-Tatar overlordship over Moscow.",
      ru: "Это противостояние обычно считается концом фактической ордынской зависимости Москвы.",
    },
  },
  {
    date: "1547",
    era: { en: "Tsardom", ru: "Царство" },
    title: { en: "Ivan IV crowned tsar", ru: "Венчание Ивана IV на царство" },
    description: {
      en: "The title tsar gave Muscovy a new imperial vocabulary and claim to sovereignty.",
      ru: "Титул царя дал Московскому государству новый имперский язык и претензию на суверенитет.",
    },
  },
  {
    date: "1598-1613",
    era: { en: "Crisis", ru: "Кризис" },
    title: { en: "Time of Troubles", ru: "Смутное время" },
    description: {
      en: "Dynastic collapse, famine, foreign intervention, and civil conflict ended with the Romanov election.",
      ru: "Династический кризис, голод, иностранное вмешательство и гражданские конфликты завершились избранием Романовых.",
    },
  },
  {
    date: "1703",
    era: { en: "Imperial turn", ru: "Имперский поворот" },
    title: { en: "Saint Petersburg founded", ru: "Основание Санкт-Петербурга" },
    description: {
      en: "Peter's new capital opened a Baltic window and announced a new imperial orientation.",
      ru: "Новая столица Петра открыла балтийское окно и обозначила новую имперскую ориентацию.",
    },
  },
  {
    date: "1721",
    era: { en: "Empire", ru: "Империя" },
    title: { en: "Russian Empire proclaimed", ru: "Провозглашение Российской империи" },
    description: {
      en: "Victory in the Great Northern War was followed by the formal imperial title.",
      ru: "Победа в Северной войне сопровождалась официальным принятием имперского титула.",
    },
  },
  {
    date: "1812",
    era: { en: "Napoleonic era", ru: "Эпоха Наполеона" },
    title: { en: "Napoleon invades Russia", ru: "Вторжение Наполеона в Россию" },
    description: {
      en: "The campaign ended in disaster for Napoleon and became central to Russian patriotic memory.",
      ru: "Кампания завершилась катастрофой для Наполеона и стала центральной частью российской патриотической памяти.",
    },
  },
  {
    date: "1861",
    era: { en: "Reform", ru: "Реформы" },
    title: { en: "Serfdom abolished", ru: "Отмена крепостного права" },
    description: {
      en: "Emancipation transformed society but left land, debt, and rural inequality unresolved.",
      ru: "Освобождение изменило общество, но оставило нерешенными вопросы земли, долгов и деревенского неравенства.",
    },
  },
  {
    date: "1917",
    era: { en: "Revolution", ru: "Революция" },
    title: { en: "February and October revolutions", ru: "Февральская и Октябрьская революции" },
    description: {
      en: "The Romanov monarchy fell; Bolsheviks later seized power and began a new state project.",
      ru: "Монархия Романовых пала; позднее большевики взяли власть и начали новый государственный проект.",
    },
  },
  {
    date: "1922",
    era: { en: "USSR", ru: "СССР" },
    title: { en: "USSR founded", ru: "Образование СССР" },
    description: {
      en: "The Soviet Union formed as a federation led from Moscow after civil war.",
      ru: "Советский Союз возник как федерация с центром в Москве после гражданской войны.",
    },
  },
  {
    date: "1941-1945",
    era: { en: "World War II", ru: "Вторая мировая" },
    title: { en: "Great Patriotic War", ru: "Великая Отечественная война" },
    description: {
      en: "The Soviet Union suffered enormous losses and emerged as a victorious superpower.",
      ru: "Советский Союз понес огромные потери и вышел из войны державой-победительницей.",
    },
  },
  {
    date: "1989-1991",
    era: { en: "End of USSR", ru: "Конец СССР" },
    title: { en: "Soviet bloc collapses", ru: "Распад советского блока" },
    description: {
      en: "Communist rule fell across Eastern Europe; the USSR dissolved in December 1991.",
      ru: "Коммунистические режимы пали в Восточной Европе; СССР распался в декабре 1991 года.",
    },
  },
  {
    date: "2014",
    era: { en: "Post-Soviet order", ru: "Постсоветский порядок" },
    title: { en: "Crimea annexed", ru: "Аннексия Крыма" },
    description: {
      en: "Russia annexed Crimea from Ukraine, triggering sanctions and a major rupture with the West.",
      ru: "Россия аннексировала Крым у Украины, что вызвало санкции и глубокий разрыв с Западом.",
    },
  },
  {
    date: "2022-present",
    era: { en: "War in Ukraine", ru: "Война в Украине" },
    title: { en: "Full-scale invasion of Ukraine", ru: "Полномасштабное вторжение в Украину" },
    description: {
      en: "The war reshaped Russian politics, society, economy, and international relations.",
      ru: "Война изменила российскую политику, общество, экономику и международные отношения.",
    },
  },
];
