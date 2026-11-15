export type Challenge = {
  question: string
  choices: string[]
  answer: number
  hint: string
  explanation: string
}

export type Level = 'explorer' | 'scientist' | 'mission'

export type LearningActivity = {
  id: string
  title: string
  objective: string
  levels: Record<Level, Challenge>
}

export const LEVELS: { id: Level; label: string; detail: string }[] = [
  { id: 'explorer', label: 'Explorer', detail: 'Start with the basics' },
  { id: 'scientist', label: 'Scientist', detail: 'Look a little closer' },
  { id: 'mission', label: 'Mission', detail: 'Put the clues together' },
]

export const ECOSYSTEMS = [
  { id: 'amazon', name: 'Amazon Rainforest', biome: 'Tropical forest', lat: -3.5, lon: -62, color: '#53D6B2', fact: 'Warm, wet conditions support an extraordinary variety of life. Forests also move water into the air through evaporation and transpiration.' },
  { id: 'sahara', name: 'Sahara Desert', biome: 'Hot desert', lat: 23, lon: 12, color: '#FFC66D', fact: 'Deserts receive very little precipitation. Some desert plants and animals are adapted to long dry periods.' },
  { id: 'himalaya', name: 'Himalaya', biome: 'Mountain region', lat: 28, lon: 86, color: '#B9C9FF', fact: 'Mountain height affects temperature and precipitation. Snow and ice store freshwater that can feed rivers.' },
  { id: 'arctic', name: 'Arctic Ocean', biome: 'Polar ocean', lat: 76, lon: 20, color: '#82DFFF', fact: 'Sea ice reflects much of the Sun’s energy. When ice cover changes, the ocean absorbs a different amount of sunlight.' },
  { id: 'coral', name: 'Great Barrier Reef', biome: 'Coral reef', lat: -18.3, lon: 147.7, color: '#FFA88E', fact: 'Coral reefs are living ecosystems. Corals depend on tiny algae, and warmer water can place them under stress.' },
  { id: 'mediterranean', name: 'Mediterranean Coast', biome: 'Coastal ecosystem', lat: 36, lon: 5, color: '#83D8EE', fact: 'Coasts connect land and sea. Local climate, ocean currents, and land use all shape coastal habitats.' },
]

export const GAMES: LearningActivity[] = [
  {
    id: 'climate-detective',
    title: 'Climate Detective',
    objective: 'Separate long-term climate patterns from day-to-day weather.',
    levels: {
      explorer: { question: 'Which describes climate best?', choices: ['The conditions over many years', 'The weather this afternoon', 'One windy day'], answer: 0, hint: 'Think about a pattern measured over a long time.', explanation: 'Climate describes typical conditions and patterns over many years. Weather can change from hour to hour.' },
      scientist: { question: 'Why do scientists compare many years of temperature observations?', choices: ['To find a longer-term pattern', 'To predict tomorrow exactly', 'To avoid measuring weather'], answer: 0, hint: 'A single day can be unusual; a long record helps reveal a pattern.', explanation: 'Long records help scientists distinguish longer-term climate trends from natural ups and downs. This question is about the method, not a live dataset.' },
      mission: { question: 'A town has one cold week. What is the strongest scientific conclusion?', choices: ['One cold week does not tell us the long-term climate trend', 'The planet has stopped warming', 'Climate is the same as weather'], answer: 0, hint: 'Match the size of your conclusion to the length of the evidence.', explanation: 'A short weather event cannot establish a long-term climate trend. Scientists compare many observations over time.' },
    },
  },
  {
    id: 'weather-master',
    title: 'Weather Master',
    objective: 'Connect the water cycle with clouds and precipitation.',
    levels: {
      explorer: { question: 'What happens when water vapor cools in the air?', choices: ['It can condense into tiny droplets', 'It turns into soil', 'It disappears forever'], answer: 0, hint: 'Clouds form from tiny drops or ice crystals.', explanation: 'Cooling water vapor can condense into droplets or ice crystals, helping clouds form.' },
      scientist: { question: 'Which process moves water from a lake into the atmosphere?', choices: ['Evaporation', 'Condensation', 'Collection'], answer: 0, hint: 'Sunlight warms liquid water and some molecules enter the air.', explanation: 'Evaporation changes liquid water into water vapor. The vapor can later cool and condense into clouds.' },
      mission: { question: 'A cloud grows heavy with water droplets. What may happen next?', choices: ['Precipitation can fall', 'The droplets become sunlight', 'The water cycle stops'], answer: 0, hint: 'Rain and snow are forms of water falling from clouds.', explanation: 'When cloud droplets or ice crystals grow large enough, water may fall as rain, snow, sleet, or hail.' },
    },
  },
  {
    id: 'ecosystem-guardian',
    title: 'Ecosystem Guardian',
    objective: 'Notice how living things depend on habitats and one another.',
    levels: {
      explorer: { question: 'What is an ecosystem?', choices: ['Living things interacting with each other and their surroundings', 'Only one kind of animal', 'A place with no water'], answer: 0, hint: 'It includes organisms and the environment they share.', explanation: 'An ecosystem includes living organisms and the non-living parts of their environment, interacting together.' },
      scientist: { question: 'Why can removing a habitat affect several species?', choices: ['Species depend on habitat for food, shelter, or breeding', 'Every species lives alone', 'Habitats only affect weather'], answer: 0, hint: 'Think about what animals and plants need to survive.', explanation: 'Many organisms rely on the same habitat for food, shelter, and reproduction. Habitat changes can affect a whole community.' },
      mission: { question: 'A stream becomes polluted. Which response best protects its ecosystem?', choices: ['Find and reduce the pollution source, then monitor the stream', 'Add more pollution so it is balanced', 'Ignore the plants and animals'], answer: 0, hint: 'Protecting an ecosystem starts with understanding and addressing the cause.', explanation: 'Reducing pollution at its source and checking the water over time are practical steps for protecting stream life.' },
    },
  },
  {
    id: 'data-detective',
    title: 'Data Detective',
    objective: 'Read an illustrative chart and compare values carefully.',
    levels: {
      explorer: { question: 'In this example, which season has the most rain?', choices: ['Spring', 'Summer', 'Winter'], answer: 1, hint: 'Look at the tallest bar in the example chart.', explanation: 'The example chart shows the summer bar as tallest. These are illustrative values for learning, not measured observations.' },
      scientist: { question: 'A chart shows rainfall of 2, 5, and 3 units. Which value is largest?', choices: ['2', '5', '3'], answer: 1, hint: 'Compare the three numbers, not the colors.', explanation: 'Five is greater than two and three. Always check axis labels and units when reading a real chart.' },
      mission: { question: 'Two places have different rainfall totals. What else should you check before comparing?', choices: ['The time period and units', 'The title color', 'The shape of the page'], answer: 0, hint: 'A fair comparison uses the same kind of measurement over comparable periods.', explanation: 'Time period, units, and measurement method matter. A chart should be read with its labels and context.' },
    },
  },
  {
    id: 'satellite-observer',
    title: 'Satellite Observer',
    objective: 'Discover how instruments observe Earth from above.',
    levels: {
      explorer: { question: 'What can a satellite help scientists observe?', choices: ['Clouds and changing land cover', 'Every animal’s name', 'The inside of every building'], answer: 0, hint: 'Satellites carry instruments that collect information from a distance.', explanation: 'Satellite instruments can observe clouds, oceans, vegetation, and other features. They do not identify every animal or see inside every building.' },
      scientist: { question: 'Why are repeat satellite observations useful?', choices: ['They help compare how a place changes over time', 'They make ground measurements unnecessary', 'They guarantee every pixel is perfect'], answer: 0, hint: 'A series of observations can reveal change.', explanation: 'Repeated observations can help scientists study changes. They still need to consider instrument limits, clouds, and other sources of uncertainty.' },
      mission: { question: 'An optical satellite image is covered by clouds. What should an observer remember?', choices: ['Clouds can hide the surface in that image', 'The surface stopped changing', 'The image proves there are no plants'], answer: 0, hint: 'What is physically between the satellite sensor and the ground?', explanation: 'Clouds can block an optical sensor’s view of the surface. Scientists may use other observations or dates, and should not infer unseen details.' },
    },
  },
]

export const MISSIONS: LearningActivity[] = [
  {
    id: 'water-cycle',
    title: 'Discover the Water Cycle',
    objective: 'Follow water as it moves through air, land, and oceans.',
    levels: {
      explorer: { question: 'Which process changes liquid water into water vapor?', choices: ['Evaporation', 'Freezing', 'Melting'], answer: 0, hint: 'The Sun can warm water at the surface.', explanation: 'Evaporation moves water from liquid surfaces into the atmosphere as water vapor.' },
      scientist: { question: 'How can plants move water into the air?', choices: ['Through transpiration', 'By turning water into rock', 'By stopping evaporation'], answer: 0, hint: 'Plants release water vapor from their leaves.', explanation: 'Transpiration is the release of water vapor by plants. Together with evaporation it moves water into the atmosphere.' },
      mission: { question: 'After water vapor cools and forms clouds, what could return water to Earth?', choices: ['Precipitation', 'Photosynthesis', 'Erosion only'], answer: 0, hint: 'Rain and snow return water from clouds.', explanation: 'Precipitation returns water to Earth as rain, snow, sleet, or hail, continuing the water cycle.' },
    },
  },
  {
    id: 'global-warming',
    title: 'Investigate Global Warming',
    objective: 'Explore how the enhanced greenhouse effect changes Earth’s energy balance.',
    levels: {
      explorer: { question: 'What do greenhouse gases do in Earth’s atmosphere?', choices: ['They absorb and re-emit some heat energy', 'They block all sunlight', 'They make weather stop'], answer: 0, hint: 'The natural greenhouse effect helps keep Earth warm enough for life.', explanation: 'Greenhouse gases absorb and re-emit some outgoing heat. Human activities have increased their amounts, strengthening the greenhouse effect.' },
      scientist: { question: 'Why is burning fossil fuels linked to global warming?', choices: ['It adds carbon dioxide to the atmosphere', 'It removes all clouds', 'It makes Earth rotate faster'], answer: 0, hint: 'Combustion releases a gas that traps heat in the atmosphere.', explanation: 'Burning coal, oil, and gas releases carbon dioxide. Increasing greenhouse gases changes Earth’s energy balance and warms the planet.' },
      mission: { question: 'Which evidence is most useful for studying a long-term global temperature trend?', choices: ['Many observations collected over time', 'One afternoon’s temperature', 'A guess without measurements'], answer: 0, hint: 'A trend needs a record long enough to show change.', explanation: 'Scientists use many observations, careful measurement methods, and uncertainty estimates to study long-term temperature change.' },
    },
  },
  {
    id: 'amazon',
    title: 'Explore the Amazon Rainforest',
    objective: 'Investigate how rainforest plants and water are connected.',
    levels: {
      explorer: { question: 'What is one way trees help move water into the air?', choices: ['Transpiration', 'Earthquakes', 'Magnetism'], answer: 0, hint: 'Plants release water vapor through their leaves.', explanation: 'Trees return water vapor to the atmosphere through transpiration, connecting forests to the water cycle.' },
      scientist: { question: 'Why is rainforest biodiversity important?', choices: ['Many species interact and support ecosystem functions', 'It means every species is identical', 'It prevents all natural change'], answer: 0, hint: 'Biodiversity describes the variety of life.', explanation: 'Biodiversity includes the variety of life and its interactions. Ecosystems can change, and biodiversity does not prevent every disturbance.' },
      mission: { question: 'A forest is cleared. Which change could follow?', choices: ['Habitat and local water movement may be affected', 'The water cycle disappears worldwide', 'No living things are affected'], answer: 0, hint: 'Forests provide habitat and release water to the atmosphere.', explanation: 'Forest clearing can alter habitats and local water and energy exchanges. The specific effects depend on where and how land changes.' },
    },
  },
  {
    id: 'oceans',
    title: 'Understand the Oceans',
    objective: 'Learn how oceans store and move heat.',
    levels: {
      explorer: { question: 'What can the ocean do with heat from sunlight?', choices: ['Store and move some of it', 'Turn all of it into stone', 'Stop the water cycle'], answer: 0, hint: 'Water warms and cools more slowly than land.', explanation: 'Oceans store large amounts of heat and currents move heat around the planet, influencing climate.' },
      scientist: { question: 'Why can ocean currents influence climate?', choices: ['They transport heat between regions', 'They stop winds from forming', 'They remove the atmosphere'], answer: 0, hint: 'Currents move water from place to place.', explanation: 'Ocean currents transport heat and can influence regional climate alongside the atmosphere and other factors.' },
      mission: { question: 'Why should a scientist compare ocean measurements from different depths?', choices: ['Temperature and conditions can vary with depth', 'The ocean is the same everywhere', 'Depth changes the calendar'], answer: 0, hint: 'Sunlight and mixing are not identical throughout the water column.', explanation: 'Ocean conditions can differ by depth. A profile helps describe more than a surface measurement alone.' },
    },
  },
  {
    id: 'satellite-scientist',
    title: 'Become a Satellite Scientist',
    objective: 'Match remote-sensing observations with what they can reveal.',
    levels: {
      explorer: { question: 'How does a satellite observe a forest?', choices: ['Its instrument measures energy reflected or emitted from Earth', 'It asks each tree a question', 'It touches every leaf'], answer: 0, hint: 'Remote sensing collects information without touching the target.', explanation: 'Remote-sensing instruments measure energy from Earth, helping scientists study forests and other features from a distance.' },
      scientist: { question: 'What is one reason to combine satellite observations with ground measurements?', choices: ['Ground data can help interpret and check satellite measurements', 'Satellites never need calibration', 'Ground measurements make time irrelevant'], answer: 0, hint: 'Different ways of observing can complement each other.', explanation: 'Ground observations help scientists validate and interpret satellite data. Each method has strengths and limitations.' },
      mission: { question: 'A satellite sensor measures reflected light. What can clouds do?', choices: ['They can affect or block the surface signal', 'They guarantee a perfect surface reading', 'They change the sensor into a thermometer'], answer: 0, hint: 'The sensor observes what reaches it through the atmosphere.', explanation: 'Clouds and atmospheric conditions can affect optical observations, so scientists account for them when analyzing images.' },
    },
  },
  {
    id: 'extreme-weather',
    title: 'Discover Extreme Weather',
    objective: 'Explore how weather hazards are monitored and understood.',
    levels: {
      explorer: { question: 'What is a weather forecast?', choices: ['An estimate of future atmospheric conditions', 'A guarantee of exact weather', 'A record of ancient climates'], answer: 0, hint: 'Forecasts use observations and models to estimate what may happen.', explanation: 'Forecasts estimate future weather using observations and models; they include uncertainty and can change as new information arrives.' },
      scientist: { question: 'Why combine radar and satellite observations during a storm?', choices: ['They provide different views of the weather system', 'They remove all forecast uncertainty', 'They measure exactly the same thing'], answer: 0, hint: 'Different instruments observe different features and scales.', explanation: 'Radar and satellites provide complementary observations. Together they can help meteorologists monitor storms, but cannot remove all uncertainty.' },
      mission: { question: 'What is the safest source for local emergency instructions?', choices: ['Official local emergency services', 'A game score', 'An unverified online rumor'], answer: 0, hint: 'For real safety decisions, use trusted local authorities.', explanation: 'Educational activities are not emergency advice. Follow official local authorities for warnings and safety instructions.' },
    },
  },
  {
    id: 'biodiversity',
    title: 'Protect Biodiversity',
    objective: 'Discover why variety of life matters in healthy ecosystems.',
    levels: {
      explorer: { question: 'What does biodiversity describe?', choices: ['The variety of living things', 'The number of clouds only', 'The depth of every ocean'], answer: 0, hint: 'The word refers to the diversity of life.', explanation: 'Biodiversity is the variety of life at different levels, from genes and species to ecosystems.' },
      scientist: { question: 'What can help protect biodiversity?', choices: ['Protecting habitats and reducing harmful pressures', 'Removing every native plant', 'Ignoring ecosystem changes'], answer: 0, hint: 'Many species depend on functioning habitats.', explanation: 'Protecting habitats and addressing pressures such as pollution and overuse can support biodiversity.' },
      mission: { question: 'Why monitor an ecosystem after conservation work begins?', choices: ['To learn whether conditions are changing over time', 'To guarantee no changes ever happen', 'To avoid collecting evidence'], answer: 0, hint: 'Repeated observations show whether an action is helping.', explanation: 'Monitoring helps communities evaluate environmental changes and adapt their conservation actions based on evidence.' },
    },
  },
]

export const EXPLAINERS = [
  { question: 'Why is Earth getting warmer?', answer: 'People have added extra greenhouse gases to the atmosphere, mainly by burning fossil fuels and changing land. These gases absorb and re-emit heat, changing Earth’s energy balance. This is a simple overview; scientists study detailed observations and uncertainties.' },
  { question: 'How do satellites observe our planet?', answer: 'Instruments on satellites measure energy reflected or emitted by Earth. Scientists use those measurements to study clouds, oceans, plants, ice, and land. Every instrument has limits, and clouds can hide the surface from some sensors.' },
  { question: 'Why do some regions receive less rainfall?', answer: 'Rain depends on moisture in the air, winds, temperature, mountains, and weather patterns. Dry regions often get less rising moist air, but local conditions differ. A single reason does not explain every desert.' },
  { question: 'What causes seasons?', answer: 'Earth’s axis is tilted as Earth travels around the Sun. Each hemisphere receives different angles and lengths of sunlight during the year. Seasons are not caused by Earth being much closer to the Sun in summer.' },
]

export const ACHIEVEMENTS = [
  { id: 'first-game', title: 'Curious Explorer', detail: 'Complete your first mini-game.', icon: 'sparkles' },
  { id: 'climate-detective', title: 'Climate Detective', detail: 'Solve the climate patterns game.', icon: 'thermometer' },
  { id: 'first-mission', title: 'Junior Earth Scientist', detail: 'Complete your first science mission.', icon: 'compass' },
  { id: 'satellite-observer', title: 'Satellite Observer', detail: 'Complete the satellite game.', icon: 'satellite' },
  { id: 'ecosystem-guardian', title: 'Ecosystem Guardian', detail: 'Complete the ecosystem game.', icon: 'leaf' },
  { id: 'three-missions', title: 'Mission Explorer', detail: 'Complete three different missions.', icon: 'award' },
]

export type LearningProgress = { games: string[]; missions: string[]; discoveries: string[] }

export const EMPTY_PROGRESS: LearningProgress = { games: [], missions: [], discoveries: [] }
