export type GameVisual = {
  label: string
  values: { label: string; value: number; display: string; color?: string }[]
}

export type GameStage = {
  title: string
  objective: string
  introduction: string
  question: string
  choices: string[]
  answer: number
  hint: string
  explanation: string
  visual?: GameVisual
}

export type GameBadge = {
  title: string
  description: string
  icon: 'sparkles' | 'thermometer' | 'droplets' | 'chart' | 'award' | 'cloud' | 'wind' | 'rain' | 'storm' | 'sun' | 'leaf' | 'flower' | 'tree' | 'bird' | 'globe' | 'satellite' | 'radar' | 'orbit' | 'space' | 'clock' | 'mountain' | 'forest' | 'recycle' | 'water'
}

export type ProgressiveGame = {
  id: string
  title: string
  subtitle: string
  objective: string
  intro: string
  theme: string
  icon: GameBadge['icon']
  tags: string[]
  stages: { stage: GameStage; badge: GameBadge }[]
}

export const STAGE_NAMES = [
  'Beginner Explorer',
  'Junior Scientist',
  'Earth Investigator',
  'Advanced Explorer',
  'Master Scientist',
] as const

const challenge = (
  title: string,
  objective: string,
  introduction: string,
  question: string,
  choices: string[],
  answer: number,
  hint: string,
  explanation: string,
  visual?: GameVisual,
): GameStage => ({ title, objective, introduction, question, choices, answer, hint, explanation, visual })

const badge = (title: string, description: string, icon: GameBadge['icon']): GameBadge => ({ title, description, icon })

export const PROGRESSIVE_GAMES: ProgressiveGame[] = [
  {
    id: 'climate-detective',
    title: 'Climate Detective',
    subtitle: 'Read the clues in the climate record.',
    objective: 'Practice interpreting simplified temperature and rainfall charts.',
    intro: 'Your research notebook contains small, invented example charts. Find the pattern, check the evidence, and remember: a short example is not a real climate record.',
    theme: 'climate',
    icon: 'thermometer',
    tags: ['Illustrative charts', 'Patterns', 'No live observations'],
    stages: [
      { stage: challenge('First clues', 'Read a simple set of example temperatures.', 'Four fictional monthly values are shown. Which month is warmest?', 'Which month has the highest example temperature?', ['January · 12°', 'April · 21°', 'March · 16°'], 1, 'Find the tallest bar in the example chart.', 'April has the highest displayed value. This tiny invented sample helps practice reading a chart; it is not an observed temperature record.', { label: 'Illustrative temperature · °C', values: [{ label: 'Jan', value: 12, display: '12°' }, { label: 'Feb', value: 16, display: '16°' }, { label: 'Mar', value: 18, display: '18°' }, { label: 'Apr', value: 21, display: '21°' }] }), badge: badge('Climate Rookie', 'Read your first illustrative climate chart.', 'sparkles') },
      { stage: challenge('Track the temperature', 'Compare the first and last example values.', 'An example station recorded 14°, 15°, 17°, and 18° across four made-up seasons.', 'What pattern appears in these example values?', ['They generally increase', 'They stay exactly the same', 'They decrease each step'], 0, 'Compare the first value with the last, then check the middle values.', 'The example values increase from 14° to 18°. A real climate trend needs a much longer, carefully checked record.', { label: 'Example seasonal temperatures · °C', values: [{ label: 'A', value: 14, display: '14°' }, { label: 'B', value: 15, display: '15°' }, { label: 'C', value: 17, display: '17°' }, { label: 'D', value: 18, display: '18°' }] }), badge: badge('Temperature Tracker', 'Spot a pattern in an example temperature series.', 'thermometer') },
      { stage: challenge('Follow the rainfall', 'Find the wettest month in an example rainfall chart.', 'These practice values are invented for this activity and do not describe a real place.', 'Which month has the most example rainfall?', ['May · 22 mm', 'June · 61 mm', 'July · 35 mm'], 1, 'Look for the bar that reaches highest on the rainfall chart.', 'June has the largest example rainfall value. Always check the units and place before interpreting real rainfall data.', { label: 'Illustrative rainfall · mm', values: [{ label: 'May', value: 22, display: '22' }, { label: 'Jun', value: 61, display: '61' }, { label: 'Jul', value: 35, display: '35' }, { label: 'Aug', value: 29, display: '29' }] }), badge: badge('Rainfall Investigator', 'Investigate the highest value in an example rainfall chart.', 'droplets') },
      { stage: challenge('Separate weather from climate', 'Choose evidence that can support a long-term climate pattern.', 'A detective compares a one-day temperature with a long observation record.', 'Which evidence is better for studying a long-term temperature trend?', ['One unusually hot afternoon', 'Many consistent observations across years', 'A single forecast'], 1, 'Climate describes patterns over a long time, not one afternoon.', 'Many observations across years give scientists more context to study long-term patterns. They also check measurement quality and uncertainty.', { label: 'Evidence window · illustrative', values: [{ label: '1 day', value: 12, display: '1 day' }, { label: '1 year', value: 42, display: '1 year' }, { label: 'Many years', value: 100, display: 'Many' }] }), badge: badge('Climate Analyst', 'Choose evidence suited to a long-term climate question.', 'chart') },
      { stage: challenge('Solve the climate case', 'Use careful reasoning to evaluate a claim.', 'A fictional town has one cold week. A headline says, “Climate change has ended.”', 'What is the most scientifically careful response?', ['One cold week cannot establish a long-term climate trend', 'The headline must be true', 'Climate and weather mean the same thing'], 0, 'Ask whether a week of evidence can describe many years.', 'A short weather event cannot prove that a long-term trend has ended. Scientists compare long records and consider natural variability.', { label: 'Time scale matters', values: [{ label: 'A week', value: 10, display: 'Weather' }, { label: 'Many years', value: 100, display: 'Climate' }] }), badge: badge('Climate Master', 'Complete the climate investigation series.', 'award') },
    ],
  },
  {
    id: 'save-the-planet',
    title: 'Save the Planet',
    subtitle: 'Choose thoughtful actions for a shared home.',
    objective: 'Explore how practical environmental choices can help reduce pressures.',
    intro: 'Each scene is an educational scenario, not a prediction. Consider the trade-offs, choose an action, then learn why the choice may help.',
    theme: 'planet',
    icon: 'globe',
    tags: ['Decision stories', 'Sustainability', 'Scenario-based'],
    stages: [
      { stage: challenge('A brighter school day', 'Choose an action that can reduce wasted electricity.', 'A classroom is empty at lunch, but its lights and computer are still on.', 'What is a sensible first step?', ['Switch off equipment that is not needed', 'Leave every device on all day', 'Open the refrigerator to cool the room'], 0, 'Think about which action avoids using electricity when no one needs it.', 'Turning off unneeded lights and equipment can reduce electricity use. Bigger energy decisions depend on local needs and reliable power sources.', { label: 'Classroom energy choices', values: [{ label: 'Needed', value: 45, display: 'Use' }, { label: 'Unused', value: 90, display: 'Save' }] }), badge: badge('Planet Friend', 'Make your first thoughtful planet-friendly choice.', 'sparkles') },
      { stage: challenge('The leaky tap', 'Find a way to avoid wasting fresh water.', 'A tap drips while everyone brushes their teeth.', 'What helps conserve water?', ['Turn off the tap while brushing', 'Let it run longer', 'Use more water than needed'], 0, 'Water can be saved by using only what the task needs.', 'Turning the tap off while brushing reduces unnecessary water use. Communities also protect water by fixing leaks and caring for watersheds.', { label: 'Water-use choices', values: [{ label: 'Tap off', value: 35, display: 'Less waste' }, { label: 'Tap running', value: 90, display: 'More waste' }] }), badge: badge('Green Thinker', 'Find a practical way to conserve water.', 'water') },
      { stage: challenge('A better journey', 'Compare lower-emission travel choices for a short trip.', 'The library is nearby. The family can walk, cycle, or take a car.', 'Which option avoids using a car for this short trip?', ['Walk or cycle when it is safe', 'Drive alone for every trip', 'Keep the engine running at the library'], 0, 'Choose an option that can move people without a car engine.', 'Walking or cycling for a short safe trip avoids direct vehicle exhaust for that journey. Accessibility, distance, weather, and safety matter when choosing transport.', { label: 'Travel choices', values: [{ label: 'Walk', value: 25, display: 'Active' }, { label: 'Cycle', value: 35, display: 'Active' }, { label: 'Solo car', value: 85, display: 'Vehicle' }] }), badge: badge('Sustainability Explorer', 'Compare everyday choices with care for context.', 'recycle') },
      { stage: challenge('Restore a habitat', 'Choose a community action that supports native life.', 'A garden team wants to help local pollinators and birds.', 'Which plan is a strong starting point?', ['Grow suitable native plants and avoid harmful pesticides', 'Remove every flowering plant', 'Release unknown animals into the garden'], 0, 'A habitat supports local species best when it fits the place.', 'Suitable native plants can provide food and shelter for local wildlife. It is important to choose species that belong in the area and follow local guidance.', { label: 'Habitat plan', values: [{ label: 'Native plants', value: 90, display: 'Support' }, { label: 'Unknown release', value: 15, display: 'Risk' }] }), badge: badge('Planet Protector', 'Choose a thoughtful action to support habitat.', 'leaf') },
      { stage: challenge('Build a community plan', 'Balance energy, nature, and community needs.', 'A town is planning a park. It wants shade, healthy soil, and spaces for people.', 'Which plan best combines these goals?', ['Protect existing trees, add suitable plants, and plan accessible paths', 'Remove all trees and cover the soil', 'Plant one unfamiliar species everywhere'], 0, 'A good plan protects what is already valuable and fits local needs.', 'Protecting existing trees, adding suitable plants, and designing access together can support people and habitats. Community planning should use local ecological knowledge.', { label: 'Community plan', values: [{ label: 'Nature', value: 90, display: 'Include' }, { label: 'Access', value: 90, display: 'Include' }, { label: 'Care', value: 90, display: 'Include' }] }), badge: badge('Earth Guardian', 'Complete the sustainability decision journey.', 'award') },
    ],
  },
  {
    id: 'weather-master',
    title: 'Weather Master',
    subtitle: 'Read the sky and follow the water cycle.',
    objective: 'Identify clouds, precipitation, and everyday weather clues.',
    intro: 'Weather scenes in this game are simplified examples. They help you practice observation and are not forecasts or safety alerts.',
    theme: 'weather',
    icon: 'cloud',
    tags: ['Cloud clues', 'Water cycle', 'Practice scenes'],
    stages: [
      { stage: challenge('Look up, observer', 'Match a cloudy sky clue to what you see.', 'A sky photo shows thin, wispy clouds high above the ground.', 'Which description fits these high, wispy clouds?', ['Cirrus clouds', 'Thick fog at the surface', 'Ocean waves'], 0, 'Their name begins with “c” and they look like delicate feathers.', 'Cirrus clouds are high, thin clouds often made of ice crystals. Cloud appearance alone does not give a complete forecast.', { label: 'Cloud-height clue', values: [{ label: 'High', value: 100, display: 'Cirrus' }, { label: 'Middle', value: 60, display: 'Altostratus' }, { label: 'Low', value: 25, display: 'Stratus' }] }), badge: badge('Weather Observer', 'Notice and name your first cloud clue.', 'sparkles') },
      { stage: challenge('Cloud explorer', 'Connect cooling air with cloud formation.', 'Moist air rises and cools. Tiny water droplets begin forming.', 'What process forms tiny cloud droplets from water vapor?', ['Condensation', 'Erosion', 'Combustion'], 0, 'Water vapor changes into liquid droplets when it cools.', 'Condensation happens when water vapor cools and becomes liquid droplets, or sometimes ice crystals, that make up clouds.', { label: 'Water cycle clue', values: [{ label: 'Evaporation', value: 30, display: 'Air' }, { label: 'Condensation', value: 90, display: 'Cloud' }, { label: 'Runoff', value: 40, display: 'Land' }] }), badge: badge('Cloud Explorer', 'Discover how clouds begin to form.', 'cloud') },
      { stage: challenge('Follow the rain', 'Understand when water can fall from clouds.', 'Cloud droplets collide and grow larger over time.', 'What may happen when droplets become too large to stay suspended?', ['Precipitation can fall', 'They turn into sunlight', 'The atmosphere disappears'], 0, 'Rain and snow are both kinds of precipitation.', 'Growing droplets or ice crystals can become heavy enough to fall as precipitation. The type depends on conditions through the atmosphere.', { label: 'Cloud to ground', values: [{ label: 'Tiny drops', value: 25, display: 'Cloud' }, { label: 'Growing drops', value: 60, display: 'Grow' }, { label: 'Heavy drops', value: 95, display: 'Fall' }] }), badge: badge('Storm Detective', 'Follow the clues that can lead to precipitation.', 'rain') },
      { stage: challenge('Read the weather map', 'Use a simplified map symbol to recognize wind.', 'On a practice map, arrows show air moving from high pressure toward lower pressure.', 'What do the arrows represent?', ['Wind direction', 'Mountain height', 'Rainfall amount'], 0, 'Moving air is called wind.', 'Arrows on a weather map can show wind direction. Wind speed and direction are measured with instruments and represented using map conventions.', { label: 'Practice wind directions', values: [{ label: 'North', value: 75, display: 'N' }, { label: 'East', value: 45, display: 'E' }, { label: 'South', value: 60, display: 'S' }, { label: 'West', value: 35, display: 'W' }] }), badge: badge('Atmosphere Expert', 'Interpret a simple weather-map clue.', 'wind') },
      { stage: challenge('Make a careful forecast', 'Choose a scientific way to describe an uncertain forecast.', 'Two models suggest different chances of rain for tomorrow.', 'What is the most careful way to communicate this forecast?', ['Describe the chance and explain there is uncertainty', 'Promise the weather will be exact', 'Ignore all observations'], 0, 'Forecasts estimate what may happen; they are not promises.', 'Forecasts use observations and models to estimate future conditions. Communicating uncertainty helps people understand that weather can change.', { label: 'Forecast confidence', values: [{ label: 'Possible', value: 45, display: 'Chance' }, { label: 'Certain', value: 100, display: 'Not a promise' }] }), badge: badge('Weather Master', 'Complete the weather observation series.', 'award') },
    ],
  },
  {
    id: 'ecosystem-guardian',
    title: 'Ecosystem Guardian',
    subtitle: 'Help living things thrive together.',
    objective: 'Explore relationships between organisms and their environment.',
    intro: 'An ecosystem includes living things and the non-living environment they interact with. These scenarios are learning examples, not site-specific ecological assessments.',
    theme: 'ecosystem',
    icon: 'leaf',
    tags: ['Food webs', 'Habitats', 'Biodiversity'],
    stages: [
      { stage: challenge('Meet an ecosystem', 'Identify the parts of an ecosystem.', 'A pond has water, sunlight, algae, insects, and fish.', 'Which choice names both living and non-living parts?', ['Fish and sunlight', 'Only fish', 'Only water'], 0, 'One part is alive; the other is a source of energy.', 'Fish are living organisms and sunlight is a non-living environmental factor. Ecosystems include both and their interactions.', { label: 'Pond components', values: [{ label: 'Living', value: 75, display: 'Fish' }, { label: 'Non-living', value: 55, display: 'Sunlight' }] }), badge: badge('Nature Friend', 'Identify living and non-living ecosystem parts.', 'sparkles') },
      { stage: challenge('Biodiversity explorer', 'Understand why variety of life matters.', 'A meadow has many kinds of flowers, insects, birds, and soil organisms.', 'What does biodiversity describe?', ['Variety of life', 'Only the number of clouds', 'The age of a mountain'], 0, 'The word is about diversity among living things.', 'Biodiversity means the variety of life, from genes and species to ecosystems. A diverse community contains many different forms of life.', { label: 'Meadow life', values: [{ label: 'Plants', value: 80, display: 'Variety' }, { label: 'Insects', value: 70, display: 'Variety' }, { label: 'Birds', value: 50, display: 'Variety' }] }), badge: badge('Biodiversity Explorer', 'Discover the meaning of biodiversity.', 'flower') },
      { stage: challenge('Connect the food web', 'Trace how energy moves through a food web.', 'A grasshopper eats grass, and a frog eats the grasshopper.', 'What is the grasshopper in this example?', ['A consumer that eats a producer', 'A cloud', 'A source of sunlight'], 0, 'Grass makes its own food; the grasshopper eats it.', 'Grass is a producer and the grasshopper is a consumer. Food webs show many connected feeding relationships, not just one chain.', { label: 'Simple food chain', values: [{ label: 'Sun', value: 100, display: 'Energy' }, { label: 'Grass', value: 70, display: 'Producer' }, { label: 'Frog', value: 40, display: 'Consumer' }] }), badge: badge('Ecosystem Protector', 'Understand a connection in a food web.', 'tree') },
      { stage: challenge('Protect a habitat', 'Choose a response to an ecosystem pressure.', 'A stream’s water quality is getting worse, and nearby wildlife depends on it.', 'What is a responsible first investigation?', ['Look for pollution sources and monitor water conditions', 'Assume the wildlife moved away forever', 'Add unknown chemicals'], 0, 'Find evidence about the cause before deciding what action to take.', 'Monitoring conditions and identifying pollution sources can help communities respond. Decisions should use local evidence and expert guidance.', { label: 'Investigation steps', values: [{ label: 'Observe', value: 75, display: 'Evidence' }, { label: 'Identify', value: 90, display: 'Source' }, { label: 'Respond', value: 65, display: 'Action' }] }), badge: badge('Wildlife Guardian', 'Choose evidence-based habitat protection.', 'bird') },
      { stage: challenge('Keep the ecosystem in balance', 'Recognize how one change can affect several species.', 'A pollinator population becomes smaller in a meadow.', 'Which effect could happen next?', ['Some flowering plants may receive less pollination', 'Every ecosystem interaction stops instantly', 'The meadow becomes an ocean'], 0, 'Think about which plants rely on pollinators to move pollen.', 'Some flowering plants rely on pollinators. A population change can affect connected species, though actual effects depend on the ecosystem and other pollinators.', { label: 'Meadow relationships', values: [{ label: 'Flowers', value: 85, display: 'Plants' }, { label: 'Pollinators', value: 70, display: 'Visitors' }, { label: 'Seeds', value: 45, display: 'Next' }] }), badge: badge('Ecosystem Master', 'Complete the ecosystem balance investigation.', 'award') },
    ],
  },
  {
    id: 'satellite-mission',
    title: 'Satellite Mission',
    subtitle: 'Observe Earth from a scientific point of view.',
    objective: 'Match remote-sensing observations with what they can reveal.',
    intro: 'Mission imagery and measurement values here are simplified teaching examples, not actual satellite data or NASA observations.',
    theme: 'satellite',
    icon: 'satellite',
    tags: ['Remote sensing', 'Observation', 'Practice imagery'],
    stages: [
      { stage: challenge('Launch your observation', 'Learn what a remote-sensing instrument measures.', 'A satellite sensor detects reflected sunlight from Earth.', 'What does the sensor measure?', ['Energy reaching the instrument', 'The name of every tree', 'A spoken message from a cloud'], 0, 'Remote sensing collects measurements from a distance.', 'Remote-sensing instruments measure energy reflected or emitted from Earth. Scientists interpret these measurements to study the planet.', { label: 'Measurement path', values: [{ label: 'Earth', value: 90, display: 'Reflect' }, { label: 'Sensor', value: 75, display: 'Measure' }, { label: 'Science', value: 50, display: 'Interpret' }] }), badge: badge('Space Observer', 'Start your first Earth observation mission.', 'sparkles') },
      { stage: challenge('Read a color clue', 'Interpret a simplified satellite-image legend.', 'In this practice image, green pixels indicate areas with more vegetation signal. The colors are illustrative.', 'What does a green pixel represent in this example?', ['A stronger vegetation signal in the teaching image', 'A live map of today’s forests', 'A measured ocean temperature'], 0, 'Use the legend given for this simplified image.', 'The legend says green represents a stronger vegetation signal in this example. Real satellite products require metadata and quality checks.', { label: 'Illustrative pixel legend', values: [{ label: 'Low', value: 25, display: 'Sparse' }, { label: 'Medium', value: 55, display: 'Mixed' }, { label: 'High', value: 90, display: 'More signal' }] }), badge: badge('Satellite Explorer', 'Use an image legend to read a satellite clue.', 'satellite') },
      { stage: challenge('Choose a sensor clue', 'Match a sensor type with a simplified observation.', 'One instrument measures microwave energy and can sometimes observe through clouds better than optical sensors.', 'Which observation is described?', ['Microwave remote sensing', 'A photograph taken by a person', 'A thermometer in a classroom'], 0, 'The clue names a part of the electromagnetic spectrum.', 'Microwave instruments can observe in conditions where some optical sensors are limited by clouds, though each sensor has its own strengths and limitations.', { label: 'Sensor clues', values: [{ label: 'Optical', value: 70, display: 'Light' }, { label: 'Microwave', value: 85, display: 'Radio waves' }, { label: 'Thermometer', value: 45, display: 'Contact' }] }), badge: badge('Remote Sensing Rookie', 'Match a measurement clue to a sensor family.', 'radar') },
      { stage: challenge('Check the observation', 'Notice why repeated observations help.', 'A satellite passes over the same region many times. One image has clouds; another is clearer.', 'Why compare multiple dates?', ['To observe change and find clearer views', 'To make one image perfect', 'To avoid checking quality'], 0, 'One observation may not show the whole story.', 'Repeated observations can help scientists study change and find usable views. They still check clouds, sensor differences, and measurement quality.', { label: 'Observation sequence', values: [{ label: 'Pass 1', value: 30, display: 'Cloudy' }, { label: 'Pass 2', value: 75, display: 'Clearer' }, { label: 'Pass 3', value: 65, display: 'Compare' }] }), badge: badge('Earth Observation Scientist', 'Compare repeated observations with care.', 'orbit') },
      { stage: challenge('Complete the satellite mission', 'Combine image interpretation with scientific caution.', 'A practice map shows a changing vegetation signal. No real dataset is attached to this mission.', 'What should you do before claiming a real-world change?', ['Check the source, dates, units, and quality information', 'Assume every color is a measurement', 'Ignore how the image was made'], 0, 'Scientific images need context and quality information.', 'A careful interpretation checks source, dates, units, processing, and quality. This game uses illustrative values and cannot establish real environmental change.', { label: 'Mission checklist', values: [{ label: 'Source', value: 80, display: 'Check' }, { label: 'Dates', value: 75, display: 'Compare' }, { label: 'Quality', value: 95, display: 'Review' }] }), badge: badge('Satellite Master', 'Complete the Earth-observation mission series.', 'space') },
    ],
  },
  {
    id: 'earth-time-machine',
    title: 'Earth Time Machine',
    subtitle: 'Compare carefully. Discover how Earth changes.',
    objective: 'Compare time periods and understand long-term transformations.',
    intro: 'The time-travel scenes use invented values for practice. They are not historical measurements, climate reconstructions, or actual NASA data.',
    theme: 'time',
    icon: 'clock',
    tags: ['Compare periods', 'Landscapes', 'Illustrative timeline'],
    stages: [
      { stage: challenge('Step into the past', 'Compare two example landscape snapshots.', 'A fictional valley scene shows 2 forest blocks in the first drawing and 3 in the second.', 'How many forest blocks are shown in the second example?', ['2', '3', '5'], 1, 'Count the blocks in the “later” picture.', 'The later illustration shows three forest blocks. It is an invented scene for practicing comparison, not a real land-cover map.', { label: 'Example forest blocks · invented', values: [{ label: 'Earlier', value: 40, display: '2 blocks' }, { label: 'Later', value: 60, display: '3 blocks' }] }), badge: badge('Time Traveler', 'Begin comparing illustrative Earth scenes.', 'sparkles') },
      { stage: challenge('Compare the periods', 'Compare example values across two periods.', 'A made-up example shows 18° for an earlier period and 20° for a later period.', 'What is the difference between the two example values?', ['2° warmer in the later example', '2° cooler in the later example', 'No difference'], 0, 'Subtract 18 from 20.', 'The later illustrative value is 2° higher. This is only arithmetic practice; it is not a measured climate change.', { label: 'Invented temperature example · °C', values: [{ label: 'Earlier', value: 18, display: '18°' }, { label: 'Later', value: 20, display: '20°' }] }), badge: badge('Past Explorer', 'Compare two periods in an example timeline.', 'clock') },
      { stage: challenge('Detect the landscape change', 'Notice one change without over-interpreting.', 'An imaginary map shows a larger lake in one period than another.', 'What can you safely say from this simple comparison?', ['The drawn lake area is different between the two examples', 'We know exactly why the lake changed', 'The map proves every lake changed'], 0, 'Describe what the evidence shows before guessing at a cause.', 'The pictures show different lake areas. They do not explain why; real analysis needs reliable maps, dates, and additional evidence.', { label: 'Illustrative lake area', values: [{ label: 'Earlier', value: 75, display: 'Larger' }, { label: 'Later', value: 48, display: 'Smaller' }] }), badge: badge('Change Detector', 'Describe an observed difference without guessing a cause.', 'mountain') },
      { stage: challenge('Build a timeline', 'Choose a fair way to compare observations over time.', 'Two maps were made with different colors and different-sized pixels.', 'What should a scientist check before comparing them?', ['Dates, scale, legend, and methods', 'Only the brightest color', 'The name of the map file'], 0, 'A fair comparison needs consistent information about each map.', 'Scientists check dates, scale, legend, and methods so they know whether differences are environmental or due to the data and processing.', { label: 'Timeline checks', values: [{ label: 'Date', value: 90, display: 'Check' }, { label: 'Scale', value: 82, display: 'Check' }, { label: 'Method', value: 94, display: 'Check' }] }), badge: badge('Earth Historian', 'Use context to compare two maps responsibly.', 'forest') },
      { stage: challenge('Return with a discovery', 'Separate a measured change from a possible explanation.', 'A fictional timeline shows a glacier outline becoming smaller in later example frames.', 'What is the most careful conclusion?', ['The example outline is smaller later; more evidence is needed to explain why', 'The example proves every glacier changed identically', 'The pictures reveal exact future conditions'], 0, 'State what the frames show, and keep the cause as a question.', 'The example shows a smaller outline later. Scientists use real dated observations and other evidence to investigate causes; this invented activity is not a glacier record.', { label: 'Illustrative outline size', values: [{ label: 'Earlier', value: 92, display: 'Larger' }, { label: 'Later', value: 58, display: 'Smaller' }] }), badge: badge('Planet Time Master', 'Complete the Earth time-comparison journey.', 'award') },
    ],
  },
]

export const ALL_GAME_BADGES = PROGRESSIVE_GAMES.flatMap((game) =>
  game.stages.map(({ badge: gameBadge }, index) => ({
    id: `${game.id}:${index + 1}`,
    gameId: game.id,
    stage: index + 1,
    ...gameBadge,
  })),
)

export type GameProgress = {
  completedStages: number[]
  attempts: number
  correctAnswers: number
  badgeDates: Record<number, string>
}

export type KidsArcadeProgress = {
  version: 1
  games: Record<string, GameProgress>
  recentBadges: { badgeId: string; unlockedAt: string }[]
  recentActivities: { activityId: string; completedAt: string }[]
  weeklyChallengeWeeks: string[]
}

export const EMPTY_ARCADE_PROGRESS: KidsArcadeProgress = {
  version: 1,
  games: {},
  recentBadges: [],
  recentActivities: [],
  weeklyChallengeWeeks: [],
}

export function getLearningWeekKey(date = new Date()): string {
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7))
  return monday.toISOString().slice(0, 10)
}

export function getGameProgress(progress: KidsArcadeProgress, gameId: string): GameProgress {
  return progress.games[gameId] ?? { completedStages: [], attempts: 0, correctAnswers: 0, badgeDates: {} }
}

export function getUnlockedStage(gameProgress: GameProgress, stageCount: number): number {
  let nextStage = 1
  while (gameProgress.completedStages.includes(nextStage) && nextStage < stageCount) nextStage += 1
  return nextStage
}

export function completeGameStage(
  progress: KidsArcadeProgress,
  game: ProgressiveGame,
  stageNumber: number,
): { progress: KidsArcadeProgress; newBadgeId: string | null } {
  const gameProgress = getGameProgress(progress, game.id)
  const unlockedStage = getUnlockedStage(gameProgress, game.stages.length)
  if (stageNumber > unlockedStage || stageNumber < 1 || stageNumber > game.stages.length) {
    return { progress, newBadgeId: null }
  }
  const alreadyCompleted = gameProgress.completedStages.includes(stageNumber)
  const unlockedAt = new Date().toISOString()
  const badgeId = `${game.id}:${stageNumber}`
  const weekKey = getLearningWeekKey(new Date(unlockedAt))
  const activityId = badgeId
  const recentActivities = [
    ...progress.recentActivities.filter((activity) => activity.activityId !== activityId),
    { activityId, completedAt: unlockedAt },
  ].sort((a, b) => a.completedAt.localeCompare(b.completedAt)).slice(-ALL_GAME_BADGES.length)
  const activitiesThisWeek = new Set(
    recentActivities
      .filter((activity) => activity.completedAt.slice(0, 10) >= weekKey)
      .map((activity) => activity.activityId),
  )
  const weeklyChallengeWeeks = progress.weeklyChallengeWeeks.includes(weekKey) || activitiesThisWeek.size < 3
    ? progress.weeklyChallengeWeeks
    : [...progress.weeklyChallengeWeeks, weekKey]
  const newlyUnlocked = !alreadyCompleted
  const nextGameProgress: GameProgress = {
    completedStages: newlyUnlocked
      ? [...gameProgress.completedStages, stageNumber].sort((a, b) => a - b)
      : gameProgress.completedStages,
    attempts: gameProgress.attempts + 1,
    correctAnswers: gameProgress.correctAnswers + 1,
    badgeDates: newlyUnlocked
      ? { ...gameProgress.badgeDates, [stageNumber]: unlockedAt }
      : gameProgress.badgeDates,
  }
  return {
    progress: {
      ...progress,
      games: { ...progress.games, [game.id]: nextGameProgress },
      recentActivities,
      weeklyChallengeWeeks,
      recentBadges: newlyUnlocked
        ? [{ badgeId, unlockedAt }, ...progress.recentBadges.filter((badgeEntry) => badgeEntry.badgeId !== badgeId)].slice(0, 10)
        : progress.recentBadges,
    },
    newBadgeId: newlyUnlocked ? badgeId : null,
  }
}

export function parseArcadeProgress(value: unknown): KidsArcadeProgress {
  if (!value || typeof value !== 'object') return EMPTY_ARCADE_PROGRESS
  const raw = value as Record<string, unknown>
  if (raw.version !== 1 || !raw.games || typeof raw.games !== 'object') return EMPTY_ARCADE_PROGRESS
  const rawGames = raw.games as Record<string, unknown>
  const games: Record<string, GameProgress> = {}
  for (const game of PROGRESSIVE_GAMES) {
    const rawGame = rawGames[game.id]
    if (!rawGame || typeof rawGame !== 'object') continue
    const gameData = rawGame as Record<string, unknown>
    const completedStages = Array.isArray(gameData.completedStages)
      ? [...new Set(gameData.completedStages.filter((stage): stage is number => Number.isInteger(stage) && stage >= 1 && stage <= game.stages.length))].sort((a, b) => a - b)
      : []
    const badgeDatesRaw = gameData.badgeDates && typeof gameData.badgeDates === 'object'
      ? gameData.badgeDates as Record<string, unknown>
      : {}
    const badgeDates: Record<number, string> = {}
    for (const stage of completedStages) {
      const date = badgeDatesRaw[String(stage)]
      if (typeof date === 'string') badgeDates[stage] = date
    }
    games[game.id] = {
      completedStages,
      attempts: typeof gameData.attempts === 'number' && Number.isFinite(gameData.attempts) ? Math.max(0, gameData.attempts) : 0,
      correctAnswers: typeof gameData.correctAnswers === 'number' && Number.isFinite(gameData.correctAnswers) ? Math.max(0, gameData.correctAnswers) : 0,
      badgeDates,
    }
  }
  const allowedBadges = new Set(ALL_GAME_BADGES.map((gameBadge) => gameBadge.id))
  const recentBadges = Array.isArray(raw.recentBadges)
    ? raw.recentBadges.filter((entry): entry is { badgeId: string; unlockedAt: string } =>
      !!entry && typeof entry === 'object'
      && typeof (entry as Record<string, unknown>).badgeId === 'string'
      && allowedBadges.has((entry as Record<string, unknown>).badgeId as string)
      && typeof (entry as Record<string, unknown>).unlockedAt === 'string',
    ).slice(0, 10)
    : []
  const recentActivities = Array.isArray(raw.recentActivities)
    ? raw.recentActivities.filter((entry): entry is { activityId: string; completedAt: string } =>
      !!entry && typeof entry === 'object'
      && typeof (entry as Record<string, unknown>).activityId === 'string'
      && allowedBadges.has((entry as Record<string, unknown>).activityId as string)
      && typeof (entry as Record<string, unknown>).completedAt === 'string',
    ).slice(-ALL_GAME_BADGES.length)
    : []
  const weeklyChallengeWeeks = Array.isArray(raw.weeklyChallengeWeeks)
    ? [...new Set(raw.weeklyChallengeWeeks.filter((week): week is string =>
      typeof week === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(week),
    ))]
    : []
  return { version: 1, games, recentBadges, recentActivities, weeklyChallengeWeeks }
}

export function calculateArcadeStats(progress: KidsArcadeProgress) {
  const stageCount = PROGRESSIVE_GAMES.reduce((sum, game) => sum + game.stages.length, 0)
  const completedStages = Object.values(progress.games).reduce((sum, game) => sum + game.completedStages.length, 0)
  const gamesCompleted = PROGRESSIVE_GAMES.filter((game) => getGameProgress(progress, game.id).completedStages.length === game.stages.length).length
  const badgesUnlocked = Object.values(progress.games).reduce((sum, game) => sum + Object.keys(game.badgeDates).length, 0)
  const weeklyChallengesCompleted = progress.weeklyChallengeWeeks.length
  const xp = completedStages * 100 + weeklyChallengesCompleted * 50
  const currentLevel = Math.min(5, 1 + Math.floor(xp / 600))
  return { stageCount, completedStages, gamesCompleted, badgesUnlocked, weeklyChallengesCompleted, currentLevel, xp }
}
