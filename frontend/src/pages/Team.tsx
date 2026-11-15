import { Card } from '../components/ui'

const MEMBERS = [
  {
    name: 'ABDERRAHMAN ELGHAZOUI',
    role: 'TEAM LEADER',
    description: 'Leads team coordination, project vision and strategy, mission planning, product direction, scientific presentation, and overall project management.',
    image: '/assets/team/abderrahman-elghazoui.jpeg',
    imagePosition: 'center 38%',
  },
  {
    name: 'ZAINAB LAAZIRI',
    role: 'SOFTWARE & DATA',
    description: 'Works across software development, data processing, scientific data organization, and technical implementation.',
    image: '/assets/team/zainab-laaziri.jpeg',
    imagePosition: 'center 38%',
  },
  {
    name: 'ABDERRAHMAN CHAHEDI',
    role: 'TEAM MEMBER',
    description: 'Contributes to the GEO-FLEX project. Specific responsibilities are not listed here.',
  },
  {
    name: 'WIAM ELFAKIR',
    role: 'TEAM MEMBER',
    description: 'Contributes to the GEO-FLEX project. Specific responsibilities are not listed here.',
    image: '/assets/team/wiam-elfakir.jpeg',
    imagePosition: 'center 32%',
  },
  {
    name: 'SOHAYBE AMAMRANE',
    role: 'TEAM MEMBER',
    description: 'Contributes to the GEO-FLEX project. Specific responsibilities are not listed here.',
  },
  {
    name: 'ADAM AACHRINE',
    role: 'TEAM MEMBER',
    description: 'Contributes to the GEO-FLEX project. Specific responsibilities are not listed here.',
  },
]

export default function Team() {
  return (
    <section id="team" aria-labelledby="team-heading" className="team-page">
      <header className="team-intro">
        <p className="team-eyebrow"><span aria-hidden="true" /> GEO-FLEX / MISSION CREW</p>
        <h1 id="team-heading" className="team-heading">
          THE PEOPLE
          <br />
          BEHIND GEO-FLEX.
        </h1>
        <p className="team-description">
          A multidisciplinary team united by scientific curiosity, technological innovation and a shared ambition to better understand our changing planet.
        </p>
      </header>

      <div className="team-grid" aria-label="GEO-FLEX team members">
        {MEMBERS.map((member, index) => (
          <Card key={member.name} className="team-card" pad={false}>
            <div className="team-photo-frame">
              {member.image ? (
                <img
                  className="team-photo"
                  src={member.image}
                  alt={`Portrait of ${member.name}`}
                  loading={index < 3 ? 'eager' : 'lazy'}
                  decoding="async"
                  style={{ objectPosition: member.imagePosition }}
                />
              ) : (
                <div
                  className="team-photo-placeholder"
                  role="img"
                  aria-label={`Portrait placeholder for ${member.name}`}
                >
                  <span>{member.name.split(' ').map((part) => part[0]).join('')}</span>
                  <small>PORTRAIT PENDING</small>
                </div>
              )}
              <span className="team-index">MEMBER {String(index + 1).padStart(2, '0')}</span>
            </div>
            <div className="team-card-body">
              <p className="team-role">{member.role}</p>
              <h2 className="team-name">{member.name}</h2>
              <div className="team-separator" />
              <p className="team-focus">{member.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
