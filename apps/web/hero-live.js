/**
 * hero-live.js — Live-updating hero stat cards for Subix industry pages
 * Values animate smoothly with a count-up effect and refresh every 4 seconds
 */

(function () {

  // ── Per-industry card configuration ───────────────────────────────────────
  const INDUSTRY_CONFIG = {

    'real-estate': {
      card1: {
        label: 'Pipeline This Month',
        values: [[38,42,'Active Leads'],[44,48,'Active Leads'],[51,55,'Active Leads'],[36,40,'Active Leads']],
        color: 'lime',
        rows: [
          ['↑ {r}% vs last month', '+{d}'],
          ['↑ {r}% growth', '+{d} this week'],
          ['Best pipeline month', '+{d} new'],
        ]
      },
      card2: {
        label: 'Follow-Ups Due Today',
        values: [[8,14,'Calls'],[10,16,'Calls'],[12,18,'Calls'],[6,12,'Calls']],
        rows: [
          ['{d} site visits scheduled', 'On track'],
          ['{d} proposals sent', 'Active'],
          ['{v} pending follow-ups', 'Urgent'],
        ]
      },
      card3: {
        label: 'Closed This Week',
        values: [['₹1.8Cr',0],['₹2.4Cr',0],['₹3.1Cr',0],['₹2.8Cr',0],['₹1.6Cr',0]],
        prefix: '',
        color: 'purple',
        textual: true,
        rows: [
          ['{d} deals closed', '↑ Best week'],
          ['{d} deals this week', '↑ +{r}%'],
          ['{d} properties sold', 'On target'],
        ]
      }
    },

    'hospitals': {
      card1: {
        label: 'Patient Inquiries Today',
        values: [[42,56,'Received'],[58,72,'Received'],[35,48,'Received'],[65,80,'Received']],
        color: 'lime',
        rows: [
          ['↑ {r}% vs yesterday', '+{d} OPD'],
          ['{d} appointments booked', 'Active'],
          ['Peak hours: 10am–1pm', '+{d} walk-ins'],
        ]
      },
      card2: {
        label: 'Appointments Pending',
        values: [[12,20,'Today'],[18,28,'Today'],[8,15,'Today'],[22,32,'Today']],
        rows: [
          ['{d} doctors on duty', 'On schedule'],
          ['{d} OPD slots left', 'Filling fast'],
          ['{v} follow-ups due', 'Review now'],
        ]
      },
      card3: {
        label: 'Consultations This Month',
        values: [[820,980,'Done'],[1050,1200,'Done'],[940,1100,'Done'],[780,900,'Done']],
        color: 'purple',
        rows: [
          ['vs {d} last month', '↑ +{r}%'],
          ['{d} specialist visits', '↑ Growing'],
          ['{d} regular check-ups', '↑ +{r}%'],
        ]
      }
    },

    'education': {
      card1: {
        label: 'Admission Inquiries This Week',
        values: [[68,82,'New Leads'],[85,98,'New Leads'],[55,72,'New Leads'],[92,110,'New Leads']],
        color: 'lime',
        rows: [
          ['↑ Admission season', '+{d}'],
          ['+{d} vs last week', 'Peak season'],
          ['{d} course enquiries', '+{r}% up'],
        ]
      },
      card2: {
        label: 'Counsellor Follow-ups Due',
        values: [[18,26,'Today'],[22,30,'Today'],[14,20,'Today'],[28,36,'Today']],
        rows: [
          ['{d} callbacks scheduled', 'Active'],
          ['{d} test slot bookings', 'Due today'],
          ['{v} demo class signups', 'Urgent'],
        ]
      },
      card3: {
        label: 'Admissions Confirmed',
        values: [[32,42,'This Month'],[42,55,'This Month'],[28,38,'This Month'],[48,60,'This Month']],
        color: 'purple',
        rows: [
          ['vs {d} last month', '↑ +{r}%'],
          ['{d} batch seats filled', '↑ +{r}%'],
          ['Target: {d} students', 'On track'],
        ]
      }
    },

    'automobile': {
      card1: {
        label: 'Walk-ins This Week',
        values: [[18,24,'Logged'],[22,28,'Logged'],[25,32,'Logged'],[15,22,'Logged']],
        color: 'lime',
        rows: [
          ['↑ {d} test drives today', 'On track'],
          ['{d} test drives booked', 'Active'],
          ['↑ Weekend peak', '+{d} today'],
        ]
      },
      card2: {
        label: 'Follow-Up Due Today',
        values: [[8,14,'Calls'],[10,16,'Calls'],[12,18,'Calls'],[6,11,'Calls']],
        rows: [
          ['{d} negotiations in progress', 'Active'],
          ['{d} price discussions', 'Hot leads'],
          ['{v} test drive follow-ups', 'Urgent'],
        ]
      },
      card3: {
        label: 'Cars Closed This Month',
        values: [[14,20,'Units'],[18,24,'Units'],[21,28,'Units'],[11,17,'Units']],
        color: 'purple',
        rows: [
          ['vs {d} last month', '↑ +{r}%'],
          ['{d} units last month', '↑ +{r}%'],
          ['Target: {d} units', 'On track'],
        ]
      }
    },

    'insurance': {
      card1: {
        label: 'Renewals Due This Month',
        values: [[38,48,'Policies'],[45,55,'Policies'],[52,62,'Policies'],[32,42,'Policies']],
        color: 'lime',
        rows: [
          ['Alerts sent to agents', 'Active'],
          ['{d} agents notified', 'On track'],
          ['{r}% renewal rate', 'This week'],
        ]
      },
      card2: {
        label: 'New Leads This Week',
        values: [[28,38,'Assigned'],[35,45,'Assigned'],[22,32,'Assigned'],[40,52,'Assigned']],
        rows: [
          ['{d} agent-assigned', 'Dispatched'],
          ['{d} callbacks due', 'Today'],
          ['High-intent: {d}', 'Priority'],
        ]
      },
      card3: {
        label: 'Policies Renewed',
        values: [['₹14.2L',0],['₹18.4L',0],['₹22.8L',0],['₹11.6L',0],['₹16.5L',0]],
        textual: true,
        color: 'purple',
        rows: [
          ['This month', '↑ +{r}%'],
          ['Premium collected', '↑ +{r}%'],
          ['vs last month', '↑ Growing'],
        ]
      }
    },

    'construction': {
      card1: {
        label: 'Site Inquiries This Month',
        values: [[22,30,'Received'],[28,36,'Received'],[18,25,'Received'],[32,42,'Received']],
        color: 'lime',
        rows: [
          ['↑ {r}% vs last month', '+{d} this week'],
          ['{d} site visits booked', 'Active'],
          ['Peak: Commercial leads', '+{d}'],
        ]
      },
      card2: {
        label: 'Follow-ups Pending',
        values: [[6,12,'Today'],[8,14,'Today'],[10,16,'Today'],[4,10,'Today']],
        rows: [
          ['{d} proposals to send', 'Due today'],
          ['{d} site meetings set', 'Active'],
          ['{v} estimates pending', 'Urgent'],
        ]
      },
      card3: {
        label: 'Contracts Won This Month',
        values: [[4,8,'Projects'],[6,10,'Projects'],[8,12,'Projects'],[3,7,'Projects']],
        color: 'purple',
        rows: [
          ['vs {d} last month', '↑ +{r}%'],
          ['₹{r}Cr contract value', 'This month'],
          ['{d} projects last month', '↑ Growing'],
        ]
      }
    },

    'retail': {
      card1: {
        label: 'Footfall This Week',
        values: [[180,240,'Visitors'],[220,280,'Visitors'],[260,320,'Visitors'],[150,200,'Visitors']],
        color: 'lime',
        rows: [
          ['↑ {r}% vs last week', '+{d} today'],
          ['Weekend: {d} walk-ins', 'Peak'],
          ['{d} loyalty members seen', 'Active'],
        ]
      },
      card2: {
        label: 'WhatsApp Inquiries Today',
        values: [[32,48,'Messages'],[45,62,'Messages'],[28,40,'Messages'],[55,72,'Messages']],
        rows: [
          ['{d} price queries', 'Active'],
          ['{d} order placements', 'Today'],
          ['{v} stock enquiries', 'Pending'],
        ]
      },
      card3: {
        label: 'Orders This Month',
        values: [[240,320,'Completed'],[310,400,'Completed'],[380,460,'Completed'],[210,280,'Completed']],
        color: 'purple',
        rows: [
          ['vs {d} last month', '↑ +{r}%'],
          ['{d} repeat customers', '↑ Loyal'],
          ['Avg order: ₹{r}', '↑ +{r}%'],
        ]
      }
    },

    'travel': {
      card1: {
        label: 'Bookings This Week',
        values: [[28,38,'Confirmed'],[35,45,'Confirmed'],[22,32,'Confirmed'],[40,52,'Confirmed']],
        color: 'lime',
        rows: [
          ['↑ {d} packages today', 'Hot deals'],
          ['{d} flights booked', 'Active'],
          ['Peak: South India tours', '+{d}'],
        ]
      },
      card2: {
        label: 'Inquiries Pending',
        values: [[10,18,'Today'],[14,22,'Today'],[8,16,'Today'],[18,26,'Today']],
        rows: [
          ['{d} itinerary requests', 'Today'],
          ['{d} group bookings', 'Pending'],
          ['{v} custom packages', 'Awaiting'],
        ]
      },
      card3: {
        label: 'Revenue This Month',
        values: [['₹4.8L',0],['₹6.2L',0],['₹8.4L',0],['₹5.5L',0],['₹9.1L',0]],
        textual: true,
        color: 'purple',
        rows: [
          ['vs {d} last month', '↑ +{r}%'],
          ['Packages collected', '↑ +{r}%'],
          ['{d} group tours paid', 'This month'],
        ]
      }
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function countUp(el, from, to, duration, format) {
    const start = performance.now();
    const diff = to - from;
    function step(now) {
      const elapsed = Math.min(now - start, duration);
      const progress = elapsed / duration;
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(from + diff * ease);
      el.textContent = format(current);
      if (elapsed < duration) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function setCardValue(el, cfg, valEntry) {
    if (cfg.textual) {
      // textual — just swap with a fade
      el.style.opacity = '0';
      setTimeout(() => {
        el.textContent = valEntry[0];
        el.style.transition = 'opacity 0.4s';
        el.style.opacity = '1';
      }, 200);
    } else {
      const [min, max, suffix] = valEntry;
      const target = rand(min, max);
      const current = parseInt(el.textContent) || 0;
      countUp(el, current, target, 900, v => v + ' ' + suffix);
    }
  }

  function fillPlaceholders(template, v, d, r) {
    return template
      .replace(/{v}/g, v)
      .replace(/{d}/g, d)
      .replace(/{r}/g, r);
  }

  // ── Detect industry from URL ───────────────────────────────────────────────
  function getIndustry() {
    const path = window.location.pathname;
    const match = path.match(/\/industries\/([^/]+)/);
    return match ? match[1] : null;
  }

  // ── Main update function ───────────────────────────────────────────────────
  function updateCards(cfg) {
    const cards = [
      document.querySelector('.hero-card-1'),
      document.querySelector('.hero-card-2'),
      document.querySelector('.hero-card-3'),
    ];
    const cardCfgs = [cfg.card1, cfg.card2, cfg.card3];

    cardCfgs.forEach((cardCfg, i) => {
      const card = cards[i];
      if (!card || !cardCfg) return;

      const valEl = card.querySelector('.card-value');
      const rowSpans = card.querySelectorAll('.card-row span');

      if (!valEl) return;

      // Pick a random value entry
      const valEntry = cardCfg.values[Math.floor(Math.random() * cardCfg.values.length)];
      setCardValue(valEl, cardCfg, valEntry);

      // Update row text
      if (cardCfg.rows && rowSpans.length >= 2) {
        const rowTemplate = cardCfg.rows[Math.floor(Math.random() * cardCfg.rows.length)];
        const v = cardCfg.textual ? valEntry[0] : rand(valEntry[0], valEntry[1]);
        const d = rand(2, 8);
        const r = rand(12, 65);
        rowSpans[0].textContent = fillPlaceholders(rowTemplate[0], v, d, r);
        rowSpans[1].textContent = fillPlaceholders(rowTemplate[1], v, d, r);
      }
    });
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  function init() {
    const industry = getIndustry();
    if (!industry || !INDUSTRY_CONFIG[industry]) return;

    const cfg = INDUSTRY_CONFIG[industry];

    // Initial update after short delay (let page load)
    setTimeout(() => updateCards(cfg), 800);

    // Refresh every 4 seconds
    setInterval(() => updateCards(cfg), 4000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
