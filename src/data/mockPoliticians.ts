import type { DeckCard, RankingSummary } from "../types";

const seedNames = [
  ["paetongtarn-shinawatra", "Paetongtarn Shinawatra", "Prime Minister", "Pheu Thai"],
  ["srettha-thavisin", "Srettha Thavisin", "Former Prime Minister", "Independent"],
  ["pita-limjaroenrat", "Pita Limjaroenrat", "MP", "People's Party"],
  ["chaikasem-nitisiri", "Chaikasem Nitisiri", "Party Figure", "Pheu Thai"],
  ["anutin-charnvirakul", "Anutin Charnvirakul", "Deputy Prime Minister", "Bhumjaithai"],
  ["pirapan-salieng", "Pirapan Salirathavibhaga", "Deputy Prime Minister", "United Thai Nation"],
  ["phumtham-wechayachai", "Phumtham Wechayachai", "Deputy Prime Minister", "Pheu Thai"],
  ["jurin-laksanawisit", "Jurin Laksanawisit", "Senior Politician", "Democrat"],
  ["cholnan-srikaew", "Cholnan Srikaew", "Senior Figure", "Pheu Thai"],
  ["wanmuhamad-noor-matha", "Wan Muhamad Noor Matha", "Speaker", "Prachachat"],
  ["rangsiman-rome", "Rangsiman Rome", "MP", "People's Party"],
  ["sirikanya-tansakun", "Sirikanya Tansakun", "MP", "People's Party"],
  ["natthaphong-ruengpanyawut", "Natthaphong Ruengpanyawut", "Party Leader", "People's Party"],
  ["parit-wacharasin", "Parit Wacharasindhu", "MP", "People's Party"],
  ["karom-polpornklang", "Karom Polpornklang", "Government Spokesperson", "United Thai Nation"],
  ["sudarat-keyuraphan", "Sudarat Keyuraphan", "Party Leader", "Thai Sang Thai"],
  ["yingluck-shinawatra", "Yingluck Shinawatra", "Former Prime Minister", "Pheu Thai"],
  ["abhisit-vejjajiva", "Abhisit Vejjajiva", "Former Prime Minister", "Democrat"],
  ["prayut-chan-o-cha", "Prayut Chan-o-cha", "Privy Council Member", "Independent"],
  ["rawit-wongsuwan", "Prawit Wongsuwan", "Party Leader", "Palang Pracharath"],
  ["somsak-thepsuthin", "Somsak Thepsuthin", "Minister", "Pheu Thai"],
  ["varawut-silpa-archa", "Varawut Silpa-archa", "Minister", "Chartthaipattana"],
  ["chalermchai-sri-on", "Chalermchai Sri-on", "Party Figure", "Democrat"],
  ["suchart-chomklin", "Suchart Chomklin", "Minister", "United Thai Nation"],
  ["ekanat-promphan", "Ekanat Promphan", "Minister", "United Thai Nation"],
  ["thamrong-boonyakeerat", "Thamrong Boonyakeerat", "Senator", "Independent"],
  ["rosana-tositrakul", "Rosana Tositrakul", "Public Political Figure", "Independent"],
  ["tawan-tat", "Tawan Tat", "Youth Political Figure", "Independent"],
  ["chadchart-sittipunt", "Chadchart Sittipunt", "Bangkok Governor", "Independent"],
  ["wiroj-lakkhanaadisorn", "Wiroj Lakkhanaadisorn", "MP", "People's Party"],
  ["thaksin-shinawatra", "Thaksin Shinawatra", "Former Prime Minister", "Pheu Thai"],
  ["metha-suk", "Metha Suk", "Committee Figure", "Independent"],
  ["kanchana-silpa-archa", "Kanchana Silpa-archa", "Senior Politician", "Chartthaipattana"],
  ["rames-ratanachaweng", "Rames Ratanachaweng", "Spokesperson", "Democrat"],
  ["teerarat-samrejvanich", "Teerarat Samrejvanich", "Minister", "Pheu Thai"],
  ["jakkapong-saengmanee", "Jakkapong Saengmanee", "Party Figure", "Pheu Thai"],
  ["dech-it-khaothong", "Dech-it Khaothong", "Party Figure", "Democrat"],
  ["noppadon-pattama", "Noppadon Pattama", "Senior Politician", "Pheu Thai"],
  ["somkid-jatusripitak", "Somkid Jatusripitak", "Former Deputy Prime Minister", "Independent"],
  ["newin-chidchob", "Newin Chidchob", "Political Figure", "Bhumjaithai"],
  ["supachai-jaisamut", "Supachai Jaisamut", "Senior Politician", "Bhumjaithai"],
  ["surachai-srisarakham", "Surachai Srisarakham", "MP", "Independent"],
  ["acharin-porn", "Acharin Pornsawat", "Policy Figure", "Independent"],
  ["nattawut-saikua", "Nattawut Saikua", "Political Figure", "Independent"],
  ["thanathorn-juangroongruangkit", "Thanathorn Juangroongruangkit", "Political Figure", "Progressive Movement"],
  ["pannika-wanich", "Pannika Wanich", "Political Figure", "Progressive Movement"],
  ["piyabutr-saengkanokkul", "Piyabutr Saengkanokkul", "Political Figure", "Progressive Movement"],
  ["korn-chatikavanij", "Korn Chatikavanij", "Former Minister", "Independent"],
  ["mongkolkit-suksintharanon", "Mongkolkit Suksintharanon", "Political Figure", "Thai Civilized"],
  ["uthin-nanthasiri", "Uthin Nanthasiri", "Committee Figure", "Independent"]
] as const;

function createSparkline(index: number) {
  return Array.from({ length: 16 }, (_, pointIndex) => {
    const base = 41 + ((index * 7 + pointIndex * 3) % 24);
    const wave = Math.sin((pointIndex + index) / 2.8) * 5.5;
    return Number((base + wave).toFixed(1));
  });
}

export const rankingSummary: RankingSummary = {
  generatedAt: "2026-05-20T08:30:00.000Z",
  sampleSize: 8421,
  threshold: 120,
  politicians: seedNames.map(([id, displayName, roleLabel, partyLabel], index) => {
    const eligibleImpressions = 540 + index * 23;
    const researchActions = Math.round(eligibleImpressions * (0.68 - index * 0.0063));
    const researchInterestScore = Number((researchActions / eligibleImpressions).toFixed(3));
    const sparkline = createSparkline(index);

    return {
      id,
      displayName,
      roleLabel,
      partyLabel,
      regionLabel: index % 4 === 0 ? "Bangkok" : "National",
      researchInterestScore,
      researchActions,
      eligibleImpressions,
      momentum: index % 2 === 0 ? 0.8 + index / 20 : -0.5 - index / 24,
      sparkline
    };
  })
};

export const dailyDeck: DeckCard[] = rankingSummary.politicians
  .map((politician, index) => ({
    ...politician,
    searchQuery: `${politician.displayName} ${politician.partyLabel ?? ""} Thailand`.trim(),
    impressionId: `impression-${index + 1}-${politician.id}`
  }));
