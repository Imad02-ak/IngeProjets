// Algeria Wilayas, Daïras and Communes data
// Source: Organisation administrative de l'Algérie (58 wilayas)
const ALGERIA_GEO = [
  {
    code: "01", name: "Adrar",
    dairas: [
      { name: "Adrar", communes: ["Adrar", "Timmi", "Bouda"] },
      { name: "Reggane", communes: ["Reggane", "Sali"] },
      { name: "Aoulef", communes: ["Aoulef", "Timekten", "Akabli"] },
      { name: "In Salah", communes: ["In Salah", "In Ghar", "Foggaret Ezzaouia"] },
      { name: "Timimoun", communes: ["Timimoun", "Ouled Said", "Deldoul", "Charouine", "Metarfa", "Tinerkouk"] },
      { name: "Fenoughil", communes: ["Fenoughil", "Tit", "Zaouiet Kounta", "Tamest", "Sbaa"] },
      { name: "Tsabit", communes: ["Tsabit", "Tamantit"] },
      { name: "Bordj Badji Mokhtar", communes: ["Bordj Badji Mokhtar"] }
    ]
  },
  {
    code: "02", name: "Chlef",
    dairas: [
      { name: "Chlef", communes: ["Chlef", "Sendjas", "Oum Drou"] },
      { name: "Ténès", communes: ["Ténès", "Sidi Akkacha", "El Marsa"] },
      { name: "Oued Fodda", communes: ["Oued Fodda", "Ouled Abbes", "Beni Rached"] },
      { name: "Boukadir", communes: ["Boukadir", "Oued Sly", "Sobha"] },
      { name: "El Karimia", communes: ["El Karimia", "Harchoun", "Breira"] },
      { name: "Ain Merane", communes: ["Ain Merane", "Oued Goussine", "Tadjena"] },
      { name: "Abou El Hassan", communes: ["Abou El Hassan", "Beni Haoua", "Dahra"] },
      { name: "Zeboudja", communes: ["Zeboudja", "Taougrite"] },
      { name: "Ouled Fares", communes: ["Ouled Fares", "Chettia", "Labiod Medjadja"] }
    ]
  },
  {
    code: "03", name: "Laghouat",
    dairas: [
      { name: "Laghouat", communes: ["Laghouat", "Ksar El Hirane", "Mekhareg"] },
      { name: "Aflou", communes: ["Aflou", "Oued Morra"] },
      { name: "Ksar El Hirane", communes: ["Ksar El Hirane", "Hassi Delaa"] },
      { name: "Hassi R'Mel", communes: ["Hassi R'Mel"] },
      { name: "Ain Madhi", communes: ["Ain Madhi", "Tadjmout"] },
      { name: "Brida", communes: ["Brida", "El Ghicha", "Hadj Mechri"] }
    ]
  },
  {
    code: "04", name: "Oum El Bouaghi",
    dairas: [
      { name: "Oum El Bouaghi", communes: ["Oum El Bouaghi", "Behir Chergui"] },
      { name: "Ain Beida", communes: ["Ain Beida", "Berriche"] },
      { name: "Ain M'Lila", communes: ["Ain M'Lila", "Ain Fakroun", "Sigus"] },
      { name: "Ain Kercha", communes: ["Ain Kercha", "Souk Naamane"] },
      { name: "Ksar Sbahi", communes: ["Ksar Sbahi", "Ouled Zouai"] },
      { name: "Meskiana", communes: ["Meskiana", "Ain Zitoun"] },
      { name: "Dhalaa", communes: ["Dhalaa", "Ain Babouche"] },
      { name: "F'Kirina", communes: ["F'Kirina", "Hanchir Toumghani"] }
    ]
  },
  {
    code: "05", name: "Batna",
    dairas: [
      { name: "Batna", communes: ["Batna", "Fesdis", "Oued Chaaba"] },
      { name: "Barika", communes: ["Barika", "Bitam", "M'Doukel"] },
      { name: "Ain Touta", communes: ["Ain Touta", "Oued El Ma", "Hidoussa"] },
      { name: "Arris", communes: ["Arris", "Inoughissen", "Tighanimine"] },
      { name: "N'Gaous", communes: ["N'Gaous", "Sefiane"] },
      { name: "Merouana", communes: ["Merouana", "Oued El Ma"] },
      { name: "Seriana", communes: ["Seriana", "Menaa"] },
      { name: "Ras El Aioun", communes: ["Ras El Aioun", "Gosbat", "Ouled Ammar"] },
      { name: "Timgad", communes: ["Timgad", "Tazoult"] },
      { name: "Djezzar", communes: ["Djezzar", "Tkout"] },
      { name: "Ichemoul", communes: ["Ichemoul", "Tigherghar"] },
      { name: "Chemora", communes: ["Chemora", "Ouled Si Slimane"] }
    ]
  },
  {
    code: "06", name: "Béjaïa",
    dairas: [
      { name: "Béjaïa", communes: ["Béjaïa", "Oued Ghir", "Toudja"] },
      { name: "Amizour", communes: ["Amizour", "Feraoun", "Barbacha"] },
      { name: "Akbou", communes: ["Akbou", "Amalou", "Ighram"] },
      { name: "El Kseur", communes: ["El Kseur", "Tifra", "Sidi Aich"] },
      { name: "Seddouk", communes: ["Seddouk", "Amalou", "Mcisna"] },
      { name: "Kherrata", communes: ["Kherrata", "Draa El Caid", "Tamridjet"] },
      { name: "Souk El Tenine", communes: ["Souk El Tenine", "Melbou", "Tamridjt"] },
      { name: "Timezrit", communes: ["Timezrit", "Sidi Ayad", "Beni Djellil"] },
      { name: "Adekar", communes: ["Adekar", "Taourirt Ighil"] },
      { name: "Chemini", communes: ["Chemini", "Souk Oufella"] },
      { name: "Darguina", communes: ["Darguina", "Taskeriout", "Ait Smail"] }
    ]
  },
  {
    code: "07", name: "Biskra",
    dairas: [
      { name: "Biskra", communes: ["Biskra", "El Hadjeb", "Chetma"] },
      { name: "Tolga", communes: ["Tolga", "Bouchagroune", "Bordj Ben Azzouz"] },
      { name: "Ouled Djellal", communes: ["Ouled Djellal", "Doucen", "Chaiba"] },
      { name: "Sidi Okba", communes: ["Sidi Okba", "El Haouch", "Ain Naga"] },
      { name: "Djemorah", communes: ["Djemorah", "Branis"] },
      { name: "El Kantara", communes: ["El Kantara", "Ain Zaatout"] },
      { name: "Zeribet El Oued", communes: ["Zeribet El Oued", "El Feidh"] },
      { name: "Sidi Khaled", communes: ["Sidi Khaled", "Ras El Miad", "Besbes"] },
      { name: "Ourlal", communes: ["Ourlal", "Lioua"] },
      { name: "M'Chouneche", communes: ["M'Chouneche"] },
      { name: "Foughala", communes: ["Foughala", "El Outaya"] }
    ]
  },
  {
    code: "08", name: "Béchar",
    dairas: [
      { name: "Béchar", communes: ["Béchar", "Béchar Djedid"] },
      { name: "Kenadsa", communes: ["Kenadsa", "Meridja"] },
      { name: "Abadla", communes: ["Abadla", "Erg Ferradj"] },
      { name: "Beni Ounif", communes: ["Beni Ounif", "Mougheul"] },
      { name: "Tabelbala", communes: ["Tabelbala"] },
      { name: "Taghit", communes: ["Taghit"] },
      { name: "Beni Abbes", communes: ["Beni Abbes", "El Ouata", "Tamtert", "Ouled Khoudir"] },
      { name: "Igli", communes: ["Igli"] }
    ]
  },
  {
    code: "09", name: "Blida",
    dairas: [
      { name: "Blida", communes: ["Blida", "Ben Khellil", "Chiffa"] },
      { name: "Boufarik", communes: ["Boufarik", "Oued El Alleug", "Guerrouaou"] },
      { name: "Bouinan", communes: ["Bouinan", "Soumaa", "Beni Mered"] },
      { name: "Bougara", communes: ["Bougara", "Hammam Melouane"] },
      { name: "Larbaa", communes: ["Larbaa", "Oued Djer"] },
      { name: "El Affroun", communes: ["El Affroun", "Chebli", "Meftah"] },
      { name: "Mouzaia", communes: ["Mouzaia", "Ain Romana"] },
      { name: "Djebabra", communes: ["Djebabra", "Ouled Yaich"] }
    ]
  },
  {
    code: "10", name: "Bouira",
    dairas: [
      { name: "Bouira", communes: ["Bouira", "Haizer", "Oued El Berdi"] },
      { name: "Lakhdaria", communes: ["Lakhdaria", "Kadiria", "Guerrouma"] },
      { name: "Sour El Ghozlane", communes: ["Sour El Ghozlane", "Dechmia"] },
      { name: "Ain Bessem", communes: ["Ain Bessem", "Raouraoua", "Ain Laloui"] },
      { name: "Bir Ghbalou", communes: ["Bir Ghbalou", "Ain El Hadjar"] },
      { name: "Bordj Okhriss", communes: ["Bordj Okhriss", "El Hachimia"] },
      { name: "M'Chedallah", communes: ["M'Chedallah", "Saharidj", "Aghbalou"] },
      { name: "Bechloul", communes: ["Bechloul", "Aomar"] }
    ]
  },
  {
    code: "11", name: "Tamanrasset",
    dairas: [
      { name: "Tamanrasset", communes: ["Tamanrasset", "Abalessa"] },
      { name: "In Guezzam", communes: ["In Guezzam", "Tin Zaouatine"] },
      { name: "Silet", communes: ["Silet"] },
      { name: "In Amguel", communes: ["In Amguel"] },
      { name: "Tazrouk", communes: ["Tazrouk", "Ideles"] }
    ]
  },
  {
    code: "12", name: "Tébessa",
    dairas: [
      { name: "Tébessa", communes: ["Tébessa", "Hammamet", "El Ogla"] },
      { name: "Bir El Ater", communes: ["Bir El Ater", "El Kouif"] },
      { name: "Cheria", communes: ["Cheria", "Ain Zerga", "Tlidjene"] },
      { name: "El Aouinet", communes: ["El Aouinet", "Boukhadra"] },
      { name: "Ouenza", communes: ["Ouenza", "Morsott"] },
      { name: "El Ma Labiod", communes: ["El Ma Labiod", "Negrine"] }
    ]
  },
  {
    code: "13", name: "Tlemcen",
    dairas: [
      { name: "Tlemcen", communes: ["Tlemcen", "Mansourah", "Chetouane"] },
      { name: "Maghnia", communes: ["Maghnia", "Hammam Boughrara"] },
      { name: "Ghazaouet", communes: ["Ghazaouet", "Souk Tlata", "Dar Yaghmoracene"] },
      { name: "Remchi", communes: ["Remchi", "Beni Ouarsous", "Ain Youcef"] },
      { name: "Nedroma", communes: ["Nedroma", "Djebala", "Ain Kebira"] },
      { name: "Sebdou", communes: ["Sebdou", "El Gor", "Sidi Djilali"] },
      { name: "Hennaya", communes: ["Hennaya", "Ouled Mimoun", "Ain Tallout"] },
      { name: "Sidi Bel Abbes", communes: ["Bab El Assa", "Beni Boussaid"] },
      { name: "Honaine", communes: ["Honaine", "Beni Khellad"] },
      { name: "Beni Snous", communes: ["Beni Snous", "Azails", "Beni Bahdel"] },
      { name: "Sabra", communes: ["Sabra", "Terny Beni Hediel"] },
      { name: "Fellaoucene", communes: ["Fellaoucene", "Ain Fezza", "El Fehoul"] }
    ]
  },
  {
    code: "14", name: "Tiaret",
    dairas: [
      { name: "Tiaret", communes: ["Tiaret", "Meghila", "Guertoufa"] },
      { name: "Frenda", communes: ["Frenda", "Ain El Hadid", "Takhmaret"] },
      { name: "Sougueur", communes: ["Sougueur", "Naima", "Sidi Ali Mellal"] },
      { name: "Mahdia", communes: ["Mahdia", "Rahouia", "Sebt"] },
      { name: "Ksar Chellala", communes: ["Ksar Chellala", "Serghine"] },
      { name: "Mechraâ Safa", communes: ["Mechraâ Safa", "Oued Lilli"] },
      { name: "Ain Deheb", communes: ["Ain Deheb", "Chehaima"] },
      { name: "Hamadia", communes: ["Hamadia", "Ain Bouchekif"] },
      { name: "Dahmouni", communes: ["Dahmouni", "Djillali Ben Amar"] }
    ]
  },
  {
    code: "15", name: "Tizi Ouzou",
    dairas: [
      { name: "Tizi Ouzou", communes: ["Tizi Ouzou", "Beni Zmenzer"] },
      { name: "Azazga", communes: ["Azazga", "Freha", "Ifigha"] },
      { name: "Draa El Mizan", communes: ["Draa El Mizan", "Ain Zaouia", "Frikat"] },
      { name: "Larbaa Nath Irathen", communes: ["Larbaa Nath Irathen", "Ait Aggouacha", "Aghribs"] },
      { name: "Ain El Hammam", communes: ["Ain El Hammam", "Ait Yahia", "Akbil"] },
      { name: "Beni Douala", communes: ["Beni Douala", "Beni Aissi", "Beni Ziki"] },
      { name: "Boghni", communes: ["Boghni", "Assi Youcef", "Bounouh"] },
      { name: "Ouaguenoun", communes: ["Ouaguenoun", "Ait Aissa Mimoun", "Timizart"] },
      { name: "Tigzirt", communes: ["Tigzirt", "Iflissen", "Mizrana"] },
      { name: "Azeffoun", communes: ["Azeffoun", "Akerrou", "Ait Chaffa"] },
      { name: "Mekla", communes: ["Mekla", "Souama", "Ait Khellili"] },
      { name: "Ouadhia", communes: ["Ouadhia", "Tizi N'Tleta", "Agouni Gueghrane"] },
      { name: "Maatka", communes: ["Maatka", "Souk El Tenine"] },
      { name: "Bouzeguene", communes: ["Bouzeguene", "Idjeur", "Illoula Oumalou"] },
      { name: "Iferhounene", communes: ["Iferhounene", "Imsouhal"] }
    ]
  },
  {
    code: "16", name: "Alger",
    dairas: [
      { name: "Sidi M'Hamed", communes: ["Sidi M'Hamed", "Alger Centre", "El Madania"] },
      { name: "Bab El Oued", communes: ["Bab El Oued", "Casbah", "Oued Koriche", "Bologhine"] },
      { name: "Hussein Dey", communes: ["Hussein Dey", "Kouba", "El Magharia"] },
      { name: "El Harrach", communes: ["El Harrach", "Oued Smar", "Bourouba", "Bachdjarrah"] },
      { name: "Baraki", communes: ["Baraki", "Les Eucalyptus", "Sidi Moussa"] },
      { name: "Bir Mourad Raïs", communes: ["Bir Mourad Raïs", "Dely Ibrahim", "El Biar", "Ben Aknoun"] },
      { name: "Bouzareah", communes: ["Bouzareah", "Beni Messous", "Hammamet"] },
      { name: "Chéraga", communes: ["Chéraga", "Ouled Fayet", "El Achour", "Draria"] },
      { name: "Dar El Beïda", communes: ["Dar El Beïda", "Bab Ezzouar", "Bordj El Kiffan", "Mohammadia"] },
      { name: "Birtouta", communes: ["Birtouta", "Tessala El Merdja", "Ouled Chebel", "Douera"] },
      { name: "Zeralda", communes: ["Zeralda", "Staoueli", "Souidania", "Mahelma"] },
      { name: "Rouiba", communes: ["Rouiba", "Reghaia", "Ain Taya", "Heuraoua"] }
    ]
  },
  {
    code: "17", name: "Djelfa",
    dairas: [
      { name: "Djelfa", communes: ["Djelfa", "Moudjebara"] },
      { name: "Ain Oussera", communes: ["Ain Oussera", "Benhar", "Guernini"] },
      { name: "Hassi Bahbah", communes: ["Hassi Bahbah", "Zaafrane", "Had Sahary"] },
      { name: "Messaad", communes: ["Messaad", "Guettara", "Deldoul"] },
      { name: "Charef", communes: ["Charef", "Sidi Baizid"] },
      { name: "El Idrissia", communes: ["El Idrissia", "Douis"] },
      { name: "Dar Chioukh", communes: ["Dar Chioukh", "M'Liliha"] },
      { name: "Birine", communes: ["Birine", "Bouira Lahdab"] },
      { name: "Ain El Ibel", communes: ["Ain El Ibel", "Sed Rahal", "Feidh El Botma"] },
      { name: "Sidi Laadjel", communes: ["Sidi Laadjel", "Hassi El Euch"] }
    ]
  },
  {
    code: "18", name: "Jijel",
    dairas: [
      { name: "Jijel", communes: ["Jijel", "Kaous"] },
      { name: "El Milia", communes: ["El Milia", "Ouled Yahia Khedrouche", "Chekfa"] },
      { name: "Taher", communes: ["Taher", "Emir Abdelkader", "Chekfa"] },
      { name: "Sidi Maarouf", communes: ["Sidi Maarouf", "Settara", "Ziama Mansouriah"] },
      { name: "Texenna", communes: ["Texenna", "Djimla"] },
      { name: "El Ancer", communes: ["El Ancer", "Sidi Abdelaziz"] },
      { name: "Djemaa Beni Habibi", communes: ["Djemaa Beni Habibi", "Bouraoui Belhadef"] }
    ]
  },
  {
    code: "19", name: "Sétif",
    dairas: [
      { name: "Sétif", communes: ["Sétif", "El Eulma", "Ain Arnat"] },
      { name: "El Eulma", communes: ["El Eulma", "Bazer Sakra", "Ouled Sidi Ahmed"] },
      { name: "Ain Oulmene", communes: ["Ain Oulmene", "Ain Azel", "Ain Lahdjar"] },
      { name: "Bougaa", communes: ["Bougaa", "Guenzet", "Beni Ourtilane"] },
      { name: "Ain El Kebira", communes: ["Ain El Kebira", "Dehamcha", "Babor"] },
      { name: "Bordj Bou Arreridj", communes: ["Amoucha", "Beni Chebana", "Oued El Barad"] },
      { name: "Hammam Guergour", communes: ["Hammam Guergour", "Ait Naoual Mezada"] },
      { name: "Salah Bey", communes: ["Salah Bey", "Ain Roua", "Tizi N'Bechar"] },
      { name: "Bouandas", communes: ["Bouandas", "Hammam Soukhna"] }
    ]
  },
  {
    code: "20", name: "Saïda",
    dairas: [
      { name: "Saïda", communes: ["Saïda", "Doui Thabet"] },
      { name: "Ain El Hadjar", communes: ["Ain El Hadjar", "Ouled Khaled"] },
      { name: "Hassasna", communes: ["Hassasna", "Sidi Ahmed"] },
      { name: "Youb", communes: ["Youb", "Hounet", "Maamoura"] },
      { name: "El Hassasna", communes: ["El Hassasna", "Sidi Boubekeur"] },
      { name: "Moulay Larbi", communes: ["Moulay Larbi", "Tircine", "Ain Soltane"] }
    ]
  },
  {
    code: "21", name: "Skikda",
    dairas: [
      { name: "Skikda", communes: ["Skikda", "Hamadi Krouma", "El Hadaiek"] },
      { name: "Collo", communes: ["Collo", "Cheraia", "Kerkera"] },
      { name: "Azzaba", communes: ["Azzaba", "Djendel Saadi Mohamed"] },
      { name: "El Harrouch", communes: ["El Harrouch", "Zerdazas", "Salah Bouchaour"] },
      { name: "Tamalous", communes: ["Tamalous", "Ain Kechra", "Oum Toub"] },
      { name: "Ramdane Djamel", communes: ["Ramdane Djamel", "Ben Azzouz", "Ain Zouit"] },
      { name: "Sidi Mezghiche", communes: ["Sidi Mezghiche", "Ouled Attia"] }
    ]
  },
  {
    code: "22", name: "Sidi Bel Abbès",
    dairas: [
      { name: "Sidi Bel Abbès", communes: ["Sidi Bel Abbès", "Sidi Lahcene"] },
      { name: "Télagh", communes: ["Télagh", "Ain Tindamine"] },
      { name: "Sfisef", communes: ["Sfisef", "Ain El Berd"] },
      { name: "Ben Badis", communes: ["Ben Badis", "Mostefa Ben Brahim"] },
      { name: "Ras El Ma", communes: ["Ras El Ma", "Redjem Demouche"] },
      { name: "Ain Thrid", communes: ["Ain Thrid", "Sidi Ali Boussidi"] },
      { name: "Tessala", communes: ["Tessala", "Sidi Brahim"] },
      { name: "Marhoum", communes: ["Marhoum", "Sidi Hamadouche"] }
    ]
  },
  {
    code: "23", name: "Annaba",
    dairas: [
      { name: "Annaba", communes: ["Annaba", "El Bouni", "Sidi Amar"] },
      { name: "Berrahal", communes: ["Berrahal", "Oued El Aneb"] },
      { name: "El Hadjar", communes: ["El Hadjar", "Sidi Amar"] },
      { name: "Ain El Berda", communes: ["Ain El Berda", "Cheurfa", "Treat"] },
      { name: "Chetaibi", communes: ["Chetaibi", "Seraidi"] }
    ]
  },
  {
    code: "24", name: "Guelma",
    dairas: [
      { name: "Guelma", communes: ["Guelma", "Ben Djerrah", "Belkheir"] },
      { name: "Bouchegouf", communes: ["Bouchegouf", "Medjez Amar"] },
      { name: "Oued Zenati", communes: ["Oued Zenati", "Ain Makhlouf", "Ras El Agba"] },
      { name: "Hammam Debagh", communes: ["Hammam Debagh", "Ain Larbi"] },
      { name: "Heliopolis", communes: ["Heliopolis", "Bouati Mahmoud", "Ain Hassainia"] },
      { name: "Hamma Bouziane", communes: ["Hamma Bouziane", "Nechmaya"] },
      { name: "Khezaras", communes: ["Khezaras", "Tamlouka"] },
      { name: "Ain Sandel", communes: ["Ain Sandel", "Ain Ben Beida"] },
      { name: "Guelaat Bousbaâ", communes: ["Guelaat Bousbaâ", "Djebala Khemissi"] }
    ]
  },
  {
    code: "25", name: "Constantine",
    dairas: [
      { name: "Constantine", communes: ["Constantine", "El Khroub"] },
      { name: "El Khroub", communes: ["El Khroub", "Ain Smara", "Ouled Rahmoune"] },
      { name: "Hamma Bouziane", communes: ["Hamma Bouziane", "Didouche Mourad"] },
      { name: "Ain Abid", communes: ["Ain Abid", "Ben Badis"] },
      { name: "Zighoud Youcef", communes: ["Zighoud Youcef", "Beni Hamidene"] },
      { name: "Ibn Ziad", communes: ["Ibn Ziad", "Messaoud Boudjeriou"] }
    ]
  },
  {
    code: "26", name: "Médéa",
    dairas: [
      { name: "Médéa", communes: ["Médéa", "Ouzera"] },
      { name: "Berrouaghia", communes: ["Berrouaghia", "Ain Boucif"] },
      { name: "Ksar El Boukhari", communes: ["Ksar El Boukhari", "Chahbounia"] },
      { name: "Tablat", communes: ["Tablat", "Djouab", "Mihoub"] },
      { name: "El Omaria", communes: ["El Omaria", "Ouamri"] },
      { name: "Si Mahdjoub", communes: ["Si Mahdjoub", "Beni Slimane"] },
      { name: "Ain Boucif", communes: ["Ain Boucif", "Sidi Naamane"] },
      { name: "Ouled Antar", communes: ["Ouled Antar", "Seghouane"] },
      { name: "Aziz", communes: ["Aziz", "Tamesguida"] }
    ]
  },
  {
    code: "27", name: "Mostaganem",
    dairas: [
      { name: "Mostaganem", communes: ["Mostaganem", "Hassi Mameche"] },
      { name: "Ain Tedeles", communes: ["Ain Tedeles", "Sour", "Oued El Kheir"] },
      { name: "Sidi Ali", communes: ["Sidi Ali", "Abdelmalek Ramdane"] },
      { name: "Achaacha", communes: ["Achaacha", "Kheir Eddine", "Nekmaria"] },
      { name: "Mesra", communes: ["Mesra", "Ain Nouissy", "Mazagran"] },
      { name: "Bouguirat", communes: ["Bouguirat", "Sirat"] },
      { name: "Ain Boudinar", communes: ["Ain Boudinar", "Fornaka"] },
      { name: "Hassi Mameche", communes: ["Hassi Mameche", "Sayada"] }
    ]
  },
  {
    code: "28", name: "M'Sila",
    dairas: [
      { name: "M'Sila", communes: ["M'Sila", "Hammam Dalaa"] },
      { name: "Bou Saâda", communes: ["Bou Saâda", "Ouled Sidi Brahim"] },
      { name: "Ain El Melh", communes: ["Ain El Melh", "Sidi Aissa"] },
      { name: "Sidi Aissa", communes: ["Sidi Aissa", "Ain El Hadjel"] },
      { name: "Magra", communes: ["Magra", "Berhoum"] },
      { name: "Khoubana", communes: ["Khoubana", "M'cif"] },
      { name: "Ouled Derradj", communes: ["Ouled Derradj", "Benzouh", "Djebel Messaad"] },
      { name: "Ain El Hadjel", communes: ["Ain El Hadjel", "Sidi Ameur"] },
      { name: "Hammam Dalaa", communes: ["Hammam Dalaa", "Maadid"] },
      { name: "Ben Srour", communes: ["Ben Srour", "Ouled Addi Guebala"] }
    ]
  },
  {
    code: "29", name: "Mascara",
    dairas: [
      { name: "Mascara", communes: ["Mascara", "Bou Hanifia"] },
      { name: "Sig", communes: ["Sig", "Oggaz"] },
      { name: "Mohammadia", communes: ["Mohammadia", "Hachem", "Ferraguig"] },
      { name: "Tighennif", communes: ["Tighennif", "Ain Fares"] },
      { name: "Ghriss", communes: ["Ghriss", "Froha", "Maoussa"] },
      { name: "Bou Hanifia", communes: ["Bou Hanifia", "Hacine"] },
      { name: "Ain Fekan", communes: ["Ain Fekan", "Oued El Abtal"] },
      { name: "Oued Taria", communes: ["Oued Taria", "El Gueitna"] }
    ]
  },
  {
    code: "30", name: "Ouargla",
    dairas: [
      { name: "Ouargla", communes: ["Ouargla", "Rouissat", "Ain Beida"] },
      { name: "Touggourt", communes: ["Touggourt", "Nezla", "Tebesbest"] },
      { name: "Hassi Messaoud", communes: ["Hassi Messaoud"] },
      { name: "Taibet", communes: ["Taibet", "Tamacine", "Benaceur"] },
      { name: "El Hadjira", communes: ["El Hadjira", "Megarine"] },
      { name: "Sidi Khouiled", communes: ["Sidi Khouiled", "Hassi Ben Abdallah", "N'Goussa"] },
      { name: "Temacine", communes: ["Temacine", "Blidet Amor"] }
    ]
  },
  {
    code: "31", name: "Oran",
    dairas: [
      { name: "Oran", communes: ["Oran", "Bir El Djir", "Es Senia"] },
      { name: "Es Senia", communes: ["Es Senia", "Arzew", "Bethioua"] },
      { name: "Bir El Djir", communes: ["Bir El Djir", "Hassi Bounif"] },
      { name: "Ain Turk", communes: ["Ain Turk", "El Ançor", "Mers El Kebir"] },
      { name: "Arzew", communes: ["Arzew", "Sidi Ben Yebka"] },
      { name: "Gdyel", communes: ["Gdyel", "Hassi Mefsoukh", "Ben Freha"] },
      { name: "Boutlelis", communes: ["Boutlelis", "Misserghin", "Ain Kerma"] },
      { name: "Oued Tlétat", communes: ["Oued Tlétat", "Tafraoui", "Boufatis"] },
      { name: "Bethioua", communes: ["Bethioua", "Ain El Bia", "Marsat El Hadjadj"] }
    ]
  },
  {
    code: "32", name: "El Bayadh",
    dairas: [
      { name: "El Bayadh", communes: ["El Bayadh", "Rogassa"] },
      { name: "Bougtob", communes: ["Bougtob", "El Kheiter"] },
      { name: "Brezina", communes: ["Brezina", "Ghassoul"] },
      { name: "Labiodh Sidi Cheikh", communes: ["Labiodh Sidi Cheikh", "Ain El Orak"] },
      { name: "Boualem", communes: ["Boualem", "Stidia", "Tousmouline"] },
      { name: "El Abiodh Sidi Cheikh", communes: ["El Abiodh Sidi Cheikh", "Krakda"] }
    ]
  },
  {
    code: "33", name: "Illizi",
    dairas: [
      { name: "Illizi", communes: ["Illizi"] },
      { name: "Djanet", communes: ["Djanet"] },
      { name: "In Amenas", communes: ["In Amenas", "Debdeb"] },
      { name: "Bordj Omar Driss", communes: ["Bordj Omar Driss", "Bordj El Haouas"] }
    ]
  },
  {
    code: "34", name: "Bordj Bou Arréridj",
    dairas: [
      { name: "Bordj Bou Arréridj", communes: ["Bordj Bou Arréridj", "El Achir", "Colla"] },
      { name: "Ras El Oued", communes: ["Ras El Oued", "Ain Taghrout", "Bordj Zemoura"] },
      { name: "Medjana", communes: ["Medjana", "El Hamadia"] },
      { name: "Bordj Ghedir", communes: ["Bordj Ghedir", "Belimour"] },
      { name: "Mansourah", communes: ["Mansourah", "El M'hir", "Ouled Brahem"] },
      { name: "Djaafra", communes: ["Djaafra", "Bir Kasd Ali"] },
      { name: "El Achir", communes: ["El Achir", "Hasnaoua"] },
      { name: "Ain Tessera", communes: ["Ain Tessera", "Teniet En Nasr"] }
    ]
  },
  {
    code: "35", name: "Boumerdès",
    dairas: [
      { name: "Boumerdès", communes: ["Boumerdès", "Boudouaou", "Tidjelabine"] },
      { name: "Boudouaou", communes: ["Boudouaou", "Ouled Moussa", "Hammedi"] },
      { name: "Khemis El Khechna", communes: ["Khemis El Khechna", "Ouled Haddadj", "Larbatache"] },
      { name: "Dellys", communes: ["Dellys", "Baghlia", "Ben Choud"] },
      { name: "Bordj Menaiel", communes: ["Bordj Menaiel", "Si Mustapha", "Isser"] },
      { name: "Naciria", communes: ["Naciria", "Djinet", "Cap Djinet"] },
      { name: "Thénia", communes: ["Thénia", "Timezrit", "Souk El Had"] }
    ]
  },
  {
    code: "36", name: "El Tarf",
    dairas: [
      { name: "El Tarf", communes: ["El Tarf", "Ain El Assel", "Lac des Oiseaux"] },
      { name: "El Kala", communes: ["El Kala", "Bougous", "Raml Souk"] },
      { name: "Ben M'Hidi", communes: ["Ben M'Hidi", "Besbes", "Asfour"] },
      { name: "Bouteldja", communes: ["Bouteldja", "Chihani", "Zerizer"] },
      { name: "Drean", communes: ["Drean", "Chebaita Mokhtar", "Chatt"] },
      { name: "Bouchegouf", communes: ["Hammam Beni Salah", "El Aioun"] }
    ]
  },
  {
    code: "37", name: "Tindouf",
    dairas: [
      { name: "Tindouf", communes: ["Tindouf", "Oum El Assel"] }
    ]
  },
  {
    code: "38", name: "Tissemsilt",
    dairas: [
      { name: "Tissemsilt", communes: ["Tissemsilt", "Beni Chaib", "Lazharia"] },
      { name: "Bordj Bou Naama", communes: ["Bordj Bou Naama", "Sidi Lantri"] },
      { name: "Theniet El Had", communes: ["Theniet El Had", "Ouled Bessem", "Beni Lahcene"] },
      { name: "Lardjem", communes: ["Lardjem", "Melaab"] },
      { name: "Khemisti", communes: ["Khemisti", "Ain Boucif"] },
      { name: "Ammari", communes: ["Ammari", "Youssoufia"] },
      { name: "Lazharia", communes: ["Lazharia", "Boucaid"] },
      { name: "Bordj El Emir Abdelkader", communes: ["Bordj El Emir Abdelkader", "Sidi Abed"] }
    ]
  },
  {
    code: "39", name: "El Oued",
    dairas: [
      { name: "El Oued", communes: ["El Oued", "Kouinine", "Bayadha"] },
      { name: "Guemar", communes: ["Guemar", "Taghzout", "Ben Guecha"] },
      { name: "Djamaa", communes: ["Djamaa", "Sidi Amrane", "El M'Ghaier"] },
      { name: "Robbah", communes: ["Robbah", "Oued El Alenda", "Nakhla"] },
      { name: "El Meghaier", communes: ["El Meghaier", "Sidi Khellil", "Tendla"] },
      { name: "Debila", communes: ["Debila", "Hassani Abdelkrim", "Oum Touyour"] },
      { name: "Reguiba", communes: ["Reguiba", "Hamraia"] },
      { name: "Hassi Khalifa", communes: ["Hassi Khalifa", "Taleb Larbi"] }
    ]
  },
  {
    code: "40", name: "Khenchela",
    dairas: [
      { name: "Khenchela", communes: ["Khenchela", "El Mahmal", "Baghai"] },
      { name: "Kais", communes: ["Kais", "El Hamma", "Ain Touila"] },
      { name: "Bouhmama", communes: ["Bouhmama", "Chechar"] },
      { name: "El Oueldja", communes: ["El Oueldja", "Remila"] },
      { name: "Ouled Rechache", communes: ["Ouled Rechache", "Djellal"] },
      { name: "Babar", communes: ["Babar", "Tamza", "Ensigha"] },
      { name: "Ain Touila", communes: ["Ain Touila", "Taouzianat"] }
    ]
  },
  {
    code: "41", name: "Souk Ahras",
    dairas: [
      { name: "Souk Ahras", communes: ["Souk Ahras", "Merahna", "Ouled Driss"] },
      { name: "Sedrata", communes: ["Sedrata", "Khemissa"] },
      { name: "M'Daourouch", communes: ["M'Daourouch", "Drea"] },
      { name: "Taoura", communes: ["Taoura", "Mechroha", "Ouled Moumen"] },
      { name: "Haddada", communes: ["Haddada", "Zaarouria", "Oum El Adhaim"] },
      { name: "Bir Bou Haouch", communes: ["Bir Bou Haouch", "Ain Soltane", "Ouillen"] },
      { name: "Ain Zana", communes: ["Ain Zana", "Terraguelt"] }
    ]
  },
  {
    code: "42", name: "Tipaza",
    dairas: [
      { name: "Tipaza", communes: ["Tipaza", "Sidi Amar", "Nador"] },
      { name: "Cherchell", communes: ["Cherchell", "Sidi Ghiles", "Gouraya"] },
      { name: "Koléa", communes: ["Koléa", "Douaouda", "Fouka", "Chaiba"] },
      { name: "Bou Ismail", communes: ["Bou Ismail", "Ain Tagourait", "Khemisti"] },
      { name: "Hadjout", communes: ["Hadjout", "Merad", "Sidi Rached"] },
      { name: "Ahmer El Ain", communes: ["Ahmer El Ain", "Aghbal", "Menaceur"] },
      { name: "Damous", communes: ["Damous", "Bou Haroun", "Messelmoun"] }
    ]
  },
  {
    code: "43", name: "Mila",
    dairas: [
      { name: "Mila", communes: ["Mila", "Ain Mellouk", "Zeghaia"] },
      { name: "Chelghoum Laïd", communes: ["Chelghoum Laïd", "Oued Athmenia", "Tadjenanet"] },
      { name: "Ferdjioua", communes: ["Ferdjioua", "Bouhatem", "Ain Tine"] },
      { name: "Grarem Gouga", communes: ["Grarem Gouga", "Oued Endja", "Sidi Merouane"] },
      { name: "Rouached", communes: ["Rouached", "Tessala Lemtai", "Benyahia Abderrahmane"] },
      { name: "Tassadane Haddada", communes: ["Tassadane Haddada", "Minar Zarza"] },
      { name: "Terrai Bainen", communes: ["Terrai Bainen", "Hamala"] },
      { name: "Ain Beida Harriche", communes: ["Ain Beida Harriche", "Sidi Khelifa"] }
    ]
  },
  {
    code: "44", name: "Aïn Defla",
    dairas: [
      { name: "Aïn Defla", communes: ["Aïn Defla", "Mekhatria"] },
      { name: "Miliana", communes: ["Miliana", "Ben Allal", "Ain Torki"] },
      { name: "Khemis Miliana", communes: ["Khemis Miliana", "Hammam Righa", "Ain Soltane"] },
      { name: "El Attaf", communes: ["El Attaf", "Djelida", "Ain Lechiakh"] },
      { name: "Boumedfaa", communes: ["Boumedfaa", "Arib", "Hoceinia"] },
      { name: "El Abadia", communes: ["El Abadia", "Rouina", "Ain Bouyahia"] },
      { name: "Djelida", communes: ["Djelida", "Bathia"] },
      { name: "Djendel", communes: ["Djendel", "Bir Ould Khelifa", "Ain Benian"] },
      { name: "Bordj Emir Khaled", communes: ["Bordj Emir Khaled", "Tacheta Zougagha"] }
    ]
  },
  {
    code: "45", name: "Naâma",
    dairas: [
      { name: "Naâma", communes: ["Naâma", "Ain Sefra"] },
      { name: "Ain Sefra", communes: ["Ain Sefra", "Tiout"] },
      { name: "Mecheria", communes: ["Mecheria", "El Biodh"] },
      { name: "Moghrar", communes: ["Moghrar", "Asla", "Djenien Bourezg"] },
      { name: "Sfissifa", communes: ["Sfissifa", "Mekmen Ben Amar"] }
    ]
  },
  {
    code: "46", name: "Aïn Témouchent",
    dairas: [
      { name: "Aïn Témouchent", communes: ["Aïn Témouchent", "Ain Kihal", "Sidi Ben Adda"] },
      { name: "El Malah", communes: ["El Malah", "Ain Tolba", "Aghlal"] },
      { name: "Beni Saf", communes: ["Beni Saf", "Oulhaça El Gheraba", "Sidi Safi"] },
      { name: "Hammam Bou Hadjar", communes: ["Hammam Bou Hadjar", "El Amria", "Hassi El Ghella"] },
      { name: "El Amria", communes: ["El Amria", "Chentouf"] },
      { name: "Ain El Arbaa", communes: ["Ain El Arbaa", "Oued Berkeche"] }
    ]
  },
  {
    code: "47", name: "Ghardaïa",
    dairas: [
      { name: "Ghardaïa", communes: ["Ghardaïa", "Daya Ben Dahoua", "Bounoura"] },
      { name: "Metlili", communes: ["Metlili", "Sebseb"] },
      { name: "Berriane", communes: ["Berriane"] },
      { name: "El Guerrara", communes: ["El Guerrara"] },
      { name: "Zelfana", communes: ["Zelfana"] },
      { name: "El Meniaa", communes: ["El Meniaa", "Hassi El Gara"] },
      { name: "Mansourah", communes: ["Mansourah", "El Atteuf"] }
    ]
  },
  {
    code: "48", name: "Relizane",
    dairas: [
      { name: "Relizane", communes: ["Relizane", "Zemmoura", "Beni Dergoun"] },
      { name: "Oued Rhiou", communes: ["Oued Rhiou", "El Matmar", "Mediouna"] },
      { name: "Mazouna", communes: ["Mazouna", "Sidi M'Hamed Benali", "Ouarizane"] },
      { name: "Mendes", communes: ["Mendes", "Beni Zentis"] },
      { name: "Yellel", communes: ["Yellel", "Ammi Moussa", "El Guettar"] },
      { name: "Ain Tarek", communes: ["Ain Tarek", "Oued Essalem", "Had Echkalla"] },
      { name: "Ramka", communes: ["Ramka", "Sidi Lazreg", "Hamri"] },
      { name: "Djidioua", communes: ["Djidioua", "El Hassi"] }
    ]
  },
  {
    code: "49", name: "Timimoun",
    dairas: [
      { name: "Timimoun", communes: ["Timimoun", "Ouled Said"] },
      { name: "Charouine", communes: ["Charouine", "Talmine"] },
      { name: "Aougrout", communes: ["Aougrout", "Deldoul", "Metarfa"] }
    ]
  },
  {
    code: "50", name: "Bordj Badji Mokhtar",
    dairas: [
      { name: "Bordj Badji Mokhtar", communes: ["Bordj Badji Mokhtar"] },
      { name: "Timiaouine", communes: ["Timiaouine"] }
    ]
  },
  {
    code: "51", name: "Ouled Djellal",
    dairas: [
      { name: "Ouled Djellal", communes: ["Ouled Djellal", "Doucen"] },
      { name: "Sidi Khaled", communes: ["Sidi Khaled", "Ras El Miad"] },
      { name: "Besbes", communes: ["Besbes", "Chaiba"] }
    ]
  },
  {
    code: "52", name: "Béni Abbès",
    dairas: [
      { name: "Béni Abbès", communes: ["Béni Abbès", "El Ouata"] },
      { name: "Igli", communes: ["Igli", "Tamtert"] },
      { name: "Ouled Khoudir", communes: ["Ouled Khoudir", "Kerzaz"] }
    ]
  },
  {
    code: "53", name: "In Salah",
    dairas: [
      { name: "In Salah", communes: ["In Salah", "In Ghar"] },
      { name: "Foggaret Ezzaouia", communes: ["Foggaret Ezzaouia"] },
      { name: "Ain Salah", communes: ["Ain Salah"] }
    ]
  },
  {
    code: "54", name: "In Guezzam",
    dairas: [
      { name: "In Guezzam", communes: ["In Guezzam"] },
      { name: "Tin Zaouatine", communes: ["Tin Zaouatine"] }
    ]
  },
  {
    code: "55", name: "Touggourt",
    dairas: [
      { name: "Touggourt", communes: ["Touggourt", "Nezla"] },
      { name: "Temacine", communes: ["Temacine", "Blidet Amor"] },
      { name: "Taibet", communes: ["Taibet", "Benaceur"] },
      { name: "Megarine", communes: ["Megarine", "Sidi Slimane"] }
    ]
  },
  {
    code: "56", name: "Djanet",
    dairas: [
      { name: "Djanet", communes: ["Djanet"] },
      { name: "Bordj El Haouas", communes: ["Bordj El Haouas"] }
    ]
  },
  {
    code: "57", name: "El M'Ghair",
    dairas: [
      { name: "El M'Ghair", communes: ["El M'Ghair", "Sidi Khellil"] },
      { name: "Djamaa", communes: ["Djamaa", "Sidi Amrane"] },
      { name: "Oum Touyour", communes: ["Oum Touyour", "Still"] }
    ]
  },
  {
    code: "58", name: "El Meniaa",
    dairas: [
      { name: "El Meniaa", communes: ["El Meniaa"] },
      { name: "Hassi El Gara", communes: ["Hassi El Gara"] }
    ]
  }
];
