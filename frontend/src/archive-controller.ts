// @ts-nocheck
// Generated from the standalone controller. Run scripts/sync-archive.cjs to sync.
export function initializeArchive() {

  const abort = new AbortController();
  const timers = new Set();
  const frames = new Set();
  let disposed = false;
  const setTimeout = (callback, delay = 0) => {
    const id = window.setTimeout(() => { timers.delete(id); if (!disposed) callback(); }, delay);
    timers.add(id);
    return id;
  };
  const clearTimeout = (id) => { timers.delete(id); window.clearTimeout(id); };
  const requestAnimationFrame = (callback) => {
    const id = window.requestAnimationFrame((time) => { frames.delete(id); if (!disposed) callback(time); });
    frames.add(id);
    return id;
  };
  const cancelAnimationFrame = (id) => { frames.delete(id); window.cancelAnimationFrame(id); };
  const listen = (target, event, callback, options = {}) => {
    target.addEventListener(event, callback, { ...(typeof options === 'boolean' ? { capture: options } : options), signal: abort.signal });
  };
  const dispose = () => {
    disposed = true;
    abort.abort();
    timers.forEach((id) => window.clearTimeout(id));
    frames.forEach((id) => window.cancelAnimationFrame(id));
    document.body.classList.remove('menu-open', 'gridview', 'lit', 'panelopen', 'dragging', 'deep', 'has-pointer', 'ws-drawer-open', 'intro-active', 'finder-open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    const intro = document.getElementById('intro');
    if (intro) { intro.hidden = true; intro.inert = true; intro.classList.remove('is-open', 'is-closing', 'has-video'); }
    const film = document.getElementById('film');
    if (film) { try { film.pause(); } catch {} }
    const experience = document.getElementById('experience');
    if (experience) experience.inert = false;
    delete window.__resqsyncReplayIntro;
    delete window.__resqsyncSkipIntro;
    window.__resqsyncReady = false;
  };

  try {

    // Fonts enhance the page but never gate access to the workspace.
    const archiveFonts = document.getElementById("archiveFonts");
    if (archiveFonts) {
      const enableFonts = () => { archiveFonts.media = "all"; };
      listen(archiveFonts,"load",enableFonts,{ once:true });
      if (archiveFonts.sheet) enableFonts();
    }
    const appearanceKey = "resqsync-appearance-v1";
    let currentTheme = "dark";
    try {
      const savedAppearance = localStorage.getItem(appearanceKey);
      if (savedAppearance === "light" || savedAppearance === "dark") currentTheme = savedAppearance;
    } catch { /* Appearance remains usable if storage is unavailable. */ }
    document.documentElement.dataset.theme = currentTheme;
    document.querySelector('meta[name="theme-color"]').content = currentTheme === "light" ? "#f4f0e8" : "#161612";

    const shots = [
      {
        image:"https://images.pexels.com/photos/17935458/pexels-photo-17935458.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", title:"When the water reaches the door", place:"Bengal delta · Evacuation",
        note:"Families wade out as floodwater takes the village. Evacuation requests like this are exactly what ResQSync routes: who needs help, how many people, and which team is closest.",
        alt:"Women and children wade through floodwater in a village in Bengal", credit:"Kuntal Biswas / Pexels", source:"https://www.pexels.com/photo/women-wearing-traditional-clothing-standing-with-kids-in-a-flooded-village-17935458/",
      },
      {
        image:"https://images.pexels.com/photos/17609960/pexels-photo-17609960.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        title:"A Changing Street", place:"New Delhi · Situational awareness",
        note:"Monsoon conditions can change a route in minutes. Crisis Management brings the location, category, severity, and latest status into one place. This photograph supplies Indian geographic context; it does not depict a ResQSync deployment.",
        alt:"A rickshaw navigating a flooded street in New Delhi", credit:"Shantum Singh", source:"https://www.pexels.com/photo/washing-the-rickshaw-with-flood-water-17609960/",
      },
      {
        image:"https://images.pexels.com/photos/5965109/pexels-photo-5965109.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", title:"Ready before the siren", place:"Fire brigade · Staging",
        note:"A firefighter checks the engine bay before the call comes in. Resource management means knowing what every vehicle carries and whether it is serviceable before an incident claims it.",
        alt:"A firefighter arranges equipment inside a fire engine compartment", credit:"Anna Shvets / Pexels", source:"https://www.pexels.com/photo/firefighter-with-fire-engine-equipment-5965109/",
      },
      {
        image:"https://images.pexels.com/photos/28867945/pexels-photo-28867945.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        title:"A City in the Rain", place:"Mumbai · Regional coordination",
        note:"A busy city cannot be reduced to a single incident. Track multiple active events, compare their urgency, and see the requests competing for the same pool. The workspace uses fictional scenarios; this photograph provides real Indian place context.",
        alt:"Rainy-day view of Chhatrapati Shivaji Terminus in Mumbai", credit:"Roman Saienko", source:"https://www.pexels.com/photo/historic-chhatrapati-shivaji-terminus-in-mumbai-28867945/",
      },
      {
        image:"https://images.pexels.com/photos/18359764/pexels-photo-18359764.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        title:"Where Access Changes", place:"Uttarakhand · Geographic coordination",
        note:"In mountain regions, capability and access matter as much as distance. Attach coordinates and field observations to a crisis, then review its timeline before making a resource decision. This landscape is context, not evidence of a current emergency.",
        alt:"Clouds and mountains surrounding Kedarnath Valley in Uttarakhand", credit:"Soubhagya Maharana", source:"https://www.pexels.com/photo/mountains-around-valley-18359764/",
      },
      {
        image:"https://images.pexels.com/photos/6519847/pexels-photo-6519847.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", title:"The ambulance pool", place:"EMS · Ready units",
        note:"An ambulance with its doors open is capacity waiting for a decision. Track each unit's status so the coordinator knows what is free, what is en route, and what is already committed.",
        alt:"A blue ambulance parked at the roadside with its rear doors open", credit:"RDNE Stock project / Pexels", source:"https://www.pexels.com/photo/blue-and-yellow-ambulance-6519847/",
      },
      {
        image:"https://images.pexels.com/photos/29685486/pexels-photo-29685486.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        title:"Between Shore and State", place:"Kochi · Multi-agency response",
        note:"Local knowledge and regional capacity need a common coordination layer. Multi-organization roles let agencies share an operating picture without pretending that every stakeholder has the same responsibilities. Production access requires verified identities and server-side authorization.",
        alt:"Traditional fishing nets beside the backwaters in Kochi, Kerala", credit:"Ravindra Nadkarni", source:"https://www.pexels.com/photo/traditional-chinese-fishing-nets-in-kochi-kerala-29685486/",
      },
      {
        image:"https://images.pexels.com/photos/17609963/pexels-photo-17609963.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        title:"Beyond the Last Update", place:"New Delhi · Crisis timelines",
        note:"Every status change needs context. A timeline shows when an event was created, how severity changed, what was assigned, and who made the decision. In this demo, new actions are recorded locally rather than sent to an operational network.",
        alt:"Floodwater beneath a bridge in New Delhi", credit:"Shantum Singh", source:"https://www.pexels.com/photo/a-flooded-area-17609963/",
      },
      {
        image:"https://images.pexels.com/photos/6646871/pexels-photo-6646871.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", title:"Sorting the relief store", place:"Volunteers · Supplies",
        note:"Volunteers sort medicine and food into boxes for distribution. Supply tracking keeps that work honest: what is packed, what is promised, and what is still on the shelf.",
        alt:"Two volunteers sort medicine and food supplies into boxes outdoors", credit:"RDNE Stock project / Pexels", source:"https://www.pexels.com/photo/a-man-and-a-woman-packing-relief-goods-in-boxes-6646871/",
      },
      {
        image:"https://images.pexels.com/photos/33329470/pexels-photo-33329470.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        title:"The Request Behind the Water", place:"India · Conflict detection",
        note:"Individual requests may look reasonable until they are considered together. The conflict workflow detects when open demand exceeds available stock, ranks the competing incidents, and leaves a visible record of unresolved needs.",
        alt:"Rising water at the entrance of a historic building in India", credit:"Arto Suraj", source:"https://www.pexels.com/photo/flooded-entrance-of-ancient-building-in-india-33329470/",
      },
      {
        image:"https://images.pexels.com/photos/28867947/pexels-photo-28867947.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        title:"A Common Operating Picture", place:"Mumbai · Communication",
        note:"Channel messages, crisis comments, and decision notes keep stakeholders in context. A shared document belongs with the conversation that explains it. The local demo shows these workflows without claiming delivery to real teams.",
        alt:"Chhatrapati Shivaji Terminus in Mumbai", credit:"Roman Saienko", source:"https://www.pexels.com/photo/victorian-gothic-architecture-of-chhatrapati-shivaji-terminus-28867947/",
      },
      {
        image:"https://images.pexels.com/photos/2792387/pexels-photo-2792387.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        title:"The Signal Through the Rain", place:"Kolkata · Stakeholder notifications",
        note:"Notifications need to name what changed and who needs to act. Configure the intended email, SMS, and push channels in the demo, and review local notifications. Actual delivery requires an approved messaging service and backend.",
        alt:"A rain-soaked window overlooking a street in Kolkata", credit:"Rahul Pandit", source:"https://www.pexels.com/photo/man-passing-by-a-window-2792387/",
      },
      {
        image:"https://images.pexels.com/photos/36908033/pexels-photo-36908033.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        title:"The Whole Footprint", place:"Uttarakhand · Analytics",
        note:"A response dashboard needs more than a count. Review active incidents, average pool utilization, response times, and recorded changes over time. Reports in this preview are calculated from fictional demo data.",
        alt:"An aerial view of terraced fields and forests in Uttarakhand", credit:"miheer tewari", source:"https://www.pexels.com/photo/aerial-view-of-terraced-fields-in-uttarakhand-36908033/",
      },
      {
        image:"https://images.pexels.com/photos/39332347/pexels-photo-39332347.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        title:"Work That Keeps Moving", place:"Raipur · Collaboration",
        note:"The conversation should travel with an incident even when shifts change. Local comment threads, attachment metadata, and stakeholder messages show how the response context can remain attached to the work.",
        alt:"A market street on a rainy day in Raipur, India", credit:"Shubham Thakur", source:"https://www.pexels.com/photo/rainy-day-in-raipur-market-street-scene-39332347/",
      },
      {
        image:"https://images.pexels.com/photos/5964975/pexels-photo-5964975.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", title:"People make the call", place:"Command · The decision",
        note:"Two crew leads talk through the next move beside the engine. Software can rank the options, but the allocation is still a human decision, made with the picture in front of them.",
        alt:"Two firefighters in full gear discuss strategy beside a fire engine", credit:"Anna Shvets / Pexels", source:"https://www.pexels.com/photo/firefighters-talking-by-fire-engine-5964975/",
      },
      {
        image:"https://images.pexels.com/photos/35356944/pexels-photo-35356944.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        title:"A Network, Not an Island", place:"Kerala · Multi-organization access",
        note:"Admin, crisis manager, resource coordinator, and viewer are distinct responsibilities. Explore the demo as each role to see how available actions change. This is a permissions preview, not secure authentication.",
        alt:"A houseboat on Kerala's coconut-lined backwaters", credit:"Ravi Kant", source:"https://www.pexels.com/photo/tranquil-houseboat-in-kerala-s-coconut-lined-rivers-35356944/",
      },
      {
        image:"https://images.pexels.com/photos/29485267/pexels-photo-29485267.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        title:"Before the Next Request", place:"Uttarakhand · Scenario simulation",
        note:"Try a different resource pool or severity weighting before adopting a plan. Scenario simulation shows covered demand, remaining shortfall, and indicative cost. A simplified demonstration is not a prediction or a promise of clinical outcomes.",
        alt:"Rugged Himalayan mountains and greenery in Uttarakhand", credit:"INDU BIKASH SARKER", source:"https://www.pexels.com/photo/stunning-himalayan-mountain-landscape-in-uttarakhand-29485267/",
      },
      {
        image:"https://images.pexels.com/photos/38432100/pexels-photo-38432100.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        title:"A Record for Tomorrow", place:"Kerala · Historical reporting",
        note:"Export a report of the demo's incident and resource records. Historical trends, allocation history, and audit entries help teams examine how decisions evolved rather than only looking at the final assignment.",
        alt:"A boat and palm trees beside Kerala's backwaters", credit:"Ranjit Mirdha", source:"https://www.pexels.com/photo/serene-backwaters-scene-in-kerala-india-38432100/",
      },
      {
        image:"https://images.pexels.com/photos/2792385/pexels-photo-2792385.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        title:"The Time Between", place:"Kolkata · Response time analysis",
        note:"Response times need a clear starting event and a traceable ending event. The Analytics module summarizes the sample times recorded in this demo, and separates those illustrative measures from claims about real deployments.",
        alt:"A Kolkata yellow taxi seen through a rain-soaked window", credit:"Rahul Pandit", source:"https://www.pexels.com/photo/yellow-vehicle-parked-outside-2792385/",
      },
      {
        image:"https://images.pexels.com/photos/27869350/pexels-photo-27869350.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        title:"Held in Readiness", place:"Kerala · Available capacity",
        note:"Reserves are a deliberate choice, not automatically a waste. Keep availability, maintenance state, and assignment history attached to the resource so a coordinator can make that choice explicitly.",
        alt:"Fishing boats docked on the tropical backwaters of Kerala", credit:"Karl Ahnee", tall:true, source:"https://www.pexels.com/photo/kerala-backwaters-03-27869350/",
      },
      {
        image:"https://images.pexels.com/photos/33329100/pexels-photo-33329100.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        title:"One Shared Mission", place:"India · Accountable coordination",
        note:"Crisis management, resources, conflict resolution, users, collaboration, reporting, and decision support belong together. ResQSync's local demo connects these workflows around fictional Indian scenarios. It does not replace official emergency communication or command authority.",
        alt:"A Himalayan river and mountain landscape in Uttarakhand", credit:"Soubhagya Maharana", source:"https://www.pexels.com/photo/scenic-himalayan-landscape-in-uttarakhand-33329100/",
      },
    ];

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
    $("#orb").replaceChildren(); $("#grid .rows").replaceChildren(); $(".credit-list").replaceChildren();
    shots.forEach((shot,index) => {
      const card = document.createElement("div");
      card.className = `card${shot.tall ? " tall" : ""}`;
      card.dataset.idx = index;
      card.tabIndex = 0;
      card.setAttribute("role","button");
      card.setAttribute("aria-label",`Open field note: ${shot.title}`);
      const figure = document.createElement("figure");
      const image = document.createElement("img");
      image.alt = shot.alt;
      image.draggable = false;
      figure.appendChild(image);
      card.appendChild(figure);
      $("#orb").appendChild(card);
      const gridFigure = figure.cloneNode(true);
      gridFigure.dataset.idx = index;
      gridFigure.tabIndex = 0;
      gridFigure.setAttribute("role","button");
      gridFigure.setAttribute("aria-label",`Open field note: ${shot.title}`);
      const caption = document.createElement("figcaption");
      const count = document.createElement("span");
      count.textContent = String(index + 1).padStart(2,"0");
      caption.append(count,document.createTextNode(shot.title));
      gridFigure.appendChild(caption);
      $("#grid .rows").appendChild(gridFigure);
      const credit = document.createElement("a");
      credit.href = shot.source;
      credit.target = "_blank";
      credit.rel = "noopener noreferrer";
      const creditCount = document.createElement("span");
      creditCount.textContent = String(index + 1).padStart(2,"0");
      const creditTitle = document.createElement("b");
      creditTitle.textContent = shot.title;
      const author = document.createElement("small");
      author.textContent = shot.credit;
      const arrow = document.createElement("span");
      arrow.setAttribute("aria-hidden","true");
      arrow.textContent = "↗";
      credit.append(creditCount,creditTitle,author,arrow);
      $(".credit-list").appendChild(credit);
    });
    const body = document.body;
    const html = document.documentElement;
    const sunIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/></svg>';
    const moonIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.6 14a8.9 8.9 0 0 1-10.7-10.6A9 9 0 1 0 20.6 14Z"/></svg>';
    function setTheme(theme,persist = true,announce = true) {
      if (theme !== "light" && theme !== "dark") return;
      currentTheme = theme;
      html.dataset.theme = theme;
      const light = theme === "light";
      $('meta[name="theme-color"]').content = light ? "#f4f0e8" : "#161612";
      $$("[data-theme-toggle]").forEach((button) => {
        button.innerHTML = `${light ? moonIcon : sunIcon}<span class="theme-label">${light ? "Dark mode" : "Light mode"}</span>`;
        button.setAttribute("aria-label",light ? "Switch to dark mode" : "Switch to light mode");
        button.setAttribute("aria-pressed",String(light));
        button.title = light ? "Switch to dark mode" : "Switch to light mode";
      });
      if (persist) {
        try { localStorage.setItem(appearanceKey,theme); } catch { /* Session-only preference. */ }
      }
      if (announce) $("#themeStatus").textContent = `${light ? "Light" : "Dark"} mode is on.`;
      if (window.parent !== window) {
        try { window.parent.postMessage({ type:"resqsync:appearance",theme },"*"); } catch { /* Standalone use does not need a host window. */ }
      }
    }
    setTheme(currentTheme,false,false);
    const stage = $("#stage");
    const world = $("#world");
    const headline = $("#headline");
    const stageGlow = $(".stage-glow");
    const cards = $$(".card");
    const grid = $("#grid");
    const gridImages = $$("#grid .rows img");
    const gridFigures = $$("#grid .rows figure");
    const menu = $("#menu");
    const menuBtn = $("#menuBtn");
    const gridBtn = $("#gridBtn");
    const lit = $("#lit");
    const plate = $(".plate");
    const panel = $("#panel");
    const dot = $("#dot");
    const intro = $("#intro");
    const film = $("#film");
    const introProgress = $("#introProgress");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = matchMedia("(pointer: coarse)");
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const radians = Math.PI / 180;
    const thumbs = Array(shots.length).fill("");
    const blobUrls = [];
    let R = 240, perspective = 1150;
    let lastWidth = 0, lastHeight = 0;
    const revealed = true;
    let menuOpen = false, gridOpen = false, litOpen = false, panelOpen = false;
    let focused = -1, currentShot = -1, sourceNode = null, lightboxReturn = null, panelReturn = null;
    let mediaToken = 0, closeTimer = 0, lightboxFrame = 0;
    let introActive = false, introStartedAt = 0, introDuration = 5200, introGeneration = 0;
    let introEndTimer = 0, introFallbackTimer = 0, introHideTimer = 0;
    let introReturn = null;
    let locked = false, parkedScroll = 0, deep = false;
    const state = { spin:0, tilt:-4, camZ:0, dragX:0, dragY:0, velX:0, velY:0, dragging:false,autoRotate:!reduced.matches };
    let pointer = null;
    let lastFrame = performance.now(), spinResumeAt = 0;
    let sphereBorn = 0, lastPlacedR = -1;
    const cursor = { x:innerWidth / 2, y:innerHeight / 2, tx:innerWidth / 2, ty:innerHeight / 2, seen:false };

    body.classList.remove("locked");
    body.classList.add("revealed");
    $("#experience").inert = false;
    html.style.overflow = "";
    body.style.overflow = "";

    const featureModules = [
      { id:"crises",name:"Crisis Management",label:"Crises",number:"01",description:"Keep track of what's happening, where, and how serious it is.",features:["Crisis event creation and tracking","Local instant status updates: active, escalating, resolved","Severity levels and incident categories","Timeline of events and actions","Geographic coordinates, plotted locations, and map links"] },
      { id:"resources",name:"Resource Management",label:"Resources",number:"02",description:"See what you have, what's free, and what's already committed.",features:["Personnel, equipment, supplies, and facilities inventory","Availability and assigned-capacity tracking","Resource allocation to active crises","Capability profiles and specifications","Usage history and maintenance logs"] },
      { id:"conflicts",name:"Conflict Resolution",label:"Allocations",number:"03",description:"When two incidents need the same thing, decide who gets it first.",features:["Automatic detection of competing resource requests","Transparent severity / response-time priority scoring","Manual override and approval workflows","Local stakeholder notification records","Negotiation, compromise, and decision history"] },
      { id:"users",name:"Users & Roles",label:"People & access",number:"04",description:"Who's on the team, and what each person can do.",features:["Admin, crisis manager, resource coordinator, and viewer roles","Multi-organization and agency profiles","Role-based action gating in the demo","Authentication and server authorization requirements explained","Activity audit logs and local invitation previews"] },
      { id:"collaboration",name:"Communication & Collaboration",label:"Messages & files",number:"05",description:"Updates, notes, and files, kept with the incident they belong to.",features:["Local messaging with updates across same-browser tabs","Email, SMS, and push preferences (delivery not connected)","Comment threads attached to crises and decisions","Document attachment metadata and session-local file downloads","Local in-app stakeholder notifications"] },
      { id:"analytics",name:"Analytics & Reporting",label:"Reports",number:"06",description:"How resources are being used, and how quickly teams respond.",features:["Dashboard with calculated key metrics","Resource utilization reports by resource type","Response time analytics from sample records","Historical incident trends and date-range selection","Native PDF download and Excel-compatible XML export"] },
      { id:"decision",name:"Decision Support",label:"Scenario planning",number:"07",description:"Try an allocation on paper before you commit to it.",features:["Automated resource-allocation recommendation heuristic","Impact assessment through covered and uncovered demand","Scenario simulation with adjustable capacity and priority weights","Indicative INR cost and coverage analysis","Saved simulations with an audit trail"] },
    ];
    const moduleIds = ["overview",...featureModules.map((module) => module.id)];
    const roleNames = { admin:"Admin","crisis-manager":"Crisis manager","resource-coordinator":"Resource coordinator",viewer:"Viewer" };
    const actorNames = { admin:"Aditi Rao","crisis-manager":"Arjun Nair","resource-coordinator":"Meera Iyer",viewer:"Rohan Das" };
    const severityNames = { 1:"Low",2:"Moderate",3:"Elevated",4:"High",5:"Critical" };
    const storageKey = "resqsync-india-workspace-v3";
    const attachmentsInSession = new Map();
    const ui = { module:"overview",role:"admin",crisisQuery:"",crisisFilter:"all",crisisTab:"list",selectedCrisis:"C-MUM",resourceQuery:"",resourceFilter:"all",selectedResource:null,communicationTab:"messages",channel:"network",analyticsDays:30,simulation:null,conflictResource:"R-VENT" };
    let toastTimer = 0, demoStorageAvailable = true;
    const isoAgo = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();
    function seedWorkspace() {
      const crisis = (id,title,city,region,lat,lng,category,severity,status,population,responseMinutes,age) => ({ id,title,city,region,lat,lng,category,severity,status,population,responseMinutes,createdAt:isoAgo(age),timeline:[{ at:isoAgo(age),text:"Training incident created. Fictional scenario, not a live alert.",actor:"Demo seed" }] });
      const crisisData = [
        crisis("C-MUM","Mumbai monsoon flooding","Mumbai","Maharashtra",19.076,72.8777,"Flood",5,"escalating",240,16,35),
        crisis("C-DEL","Delhi hospital surge","New Delhi","Delhi",28.6139,77.209,"Medical",4,"active",85,21,100),
        crisis("C-ASM","Assam river evacuation","Guwahati","Assam",26.1445,91.7362,"Flood",5,"active",360,19,170),
        crisis("C-WAY","Wayanad slope instability","Wayanad","Kerala",11.605,76.083,"Landslide",4,"active",125,28,220),
        crisis("C-CHE","Chennai coastal preparedness","Chennai","Tamil Nadu",13.0827,80.2707,"Storm",2,"active",180,24,310),
        crisis("C-PUN","Pune warehouse fire drill","Pune","Maharashtra",18.5204,73.8567,"Fire",4,"resolved",45,12,4200),
        crisis("C-DEH","Dehradun evacuation drill","Dehradun","Uttarakhand",30.3165,78.0322,"Landslide",3,"resolved",70,17,14400),
      ];
      crisisData[0].timeline.unshift({ at:isoAgo(12),text:"Status escalated after an illustrative access update.",actor:"Arjun Nair" });
      crisisData.filter((item) => item.status === "resolved").forEach((item) => item.timeline.unshift({ at:isoAgo(item.id === "C-PUN" ? 3900 : 14000),text:"Training incident resolved.",actor:"Aditi Rao" }));
      const resource = (id,name,type,total,unit,organization,capability,cost,allocations = [],maintenance = false) => ({ id,name,type,total,unit,organization,capability,cost,maintenance,allocations:allocations.map(([crisisId,quantity]) => ({ crisisId,quantity,at:isoAgo(20),actor:"Demo seed" })),history:[{ at:isoAgo(90),text:"Inventory and capability profile verified in the training dataset.",actor:"Demo seed" }],maintenanceLog:maintenance ? [{ at:isoAgo(60),text:"Scheduled inspection. Pool temporarily unavailable.",actor:"Meera Iyer" }] : [{ at:isoAgo(2880),text:"Training readiness check completed.",actor:"Meera Iyer" }] });
      const resources = [
        resource("R-TEAM","Swiftwater rescue teams","Personnel",4,"teams","Western Response Collective","Water rescue; 6 trained responders per team; 45-minute mobilization",18000,[["C-MUM",1]]),
        resource("R-BOAT","Inflatable rescue boats","Equipment",6,"boats","Eastern Relief Network","8-person capacity; outboard motor; shallow-water access",6000,[["C-ASM",2]]),
        resource("R-OXY","Medical oxygen reserve","Supplies",24,"cylinders","Regional Trauma Consortium","Approved handling required; illustrative 47-litre reserve units",1800,[["C-DEL",8],["C-WAY",6]]),
        resource("R-AMB","ALS ambulance pool","Equipment",8,"vehicles","Regional Trauma Consortium","Advanced life support capability; staffed units in sample pool",12000,[["C-MUM",2],["C-DEL",2]]),
        resource("R-KIT","Family relief kits","Supplies",1200,"kits","Eastern Relief Network","Water containers, hygiene supplies, and temporary shelter materials",850,[["C-ASM",200]]),
        resource("R-MED","Trauma response teams","Personnel",5,"teams","Regional Trauma Consortium","4-person clinical response team; credentials illustrative only",22000,[["C-DEL",1]]),
        resource("R-CAMP","District relief-camp capacity","Facilities",320,"places","Southern Response Collective","Sheltered accommodation; water and sanitation availability",450,[["C-ASM",100]]),
        resource("R-GEN","Portable generator pool","Equipment",4,"units","Southern Response Collective","20 kVA; weather-protected; operator required",4500,[],true),
        resource("R-VENT","Ventilator reserve","Equipment",10,"units","Regional Trauma Consortium","Illustrative transport-compatible units; clinical approval required",5500),
        resource("R-COMM","Emergency communication kits","Equipment",6,"kits","Western Response Collective","Portable radio, battery reserve, and antenna package",2500,[["C-ASM",1]]),
      ];
      return { version:3,crises:crisisData,resources,requests:[
        { id:"Q1",resourceId:"R-TEAM",crisisId:"C-MUM",quantity:3 },{ id:"Q2",resourceId:"R-TEAM",crisisId:"C-ASM",quantity:2 },
        { id:"Q3",resourceId:"R-BOAT",crisisId:"C-ASM",quantity:4 },{ id:"Q4",resourceId:"R-BOAT",crisisId:"C-MUM",quantity:3 },
        { id:"Q5",resourceId:"R-VENT",crisisId:"C-DEL",quantity:6 },{ id:"Q6",resourceId:"R-VENT",crisisId:"C-WAY",quantity:5 },{ id:"Q7",resourceId:"R-VENT",crisisId:"C-ASM",quantity:4 },
        { id:"Q8",resourceId:"R-OXY",crisisId:"C-DEL",quantity:12 },{ id:"Q9",resourceId:"R-OXY",crisisId:"C-WAY",quantity:10 },
      ],users:[
        { id:"U1",name:"Aditi Rao",email:"aditi@example.org",organization:"Western Response Collective",role:"admin",status:"Active demo" },
        { id:"U2",name:"Arjun Nair",email:"arjun@example.org",organization:"Southern Response Collective",role:"crisis-manager",status:"Active demo" },
        { id:"U3",name:"Meera Iyer",email:"meera@example.org",organization:"Regional Trauma Consortium",role:"resource-coordinator",status:"Active demo" },
        { id:"U4",name:"Rohan Das",email:"rohan@example.org",organization:"Eastern Relief Network",role:"viewer",status:"Active demo" },
      ],messages:[
        { id:"M1",channel:"network",author:"Arjun Nair",text:"Training update: all regions are visible in the shared picture. Please add resource gaps to the relevant incident thread.",at:isoAgo(30) },
        { id:"M2",channel:"C-MUM",author:"Meera Iyer",text:"One swiftwater team is assigned. Three more teams have been requested in this fictional scenario.",at:isoAgo(18) },
        { id:"M3",channel:"decisions",author:"Aditi Rao",text:"Clinical allocations need authorized approval. Keep the rationale with any override.",at:isoAgo(15) },
      ],notifications:[{ id:"N1",text:"Four resource pools have competing requests in the training dataset.",at:isoAgo(5),read:false,channel:"In-app demo" }],attachments:[],decisions:[],negotiations:[],simulations:[],preferences:{ email:false,sms:false,push:false },audit:[{ id:"A1",at:isoAgo(35),actor:"Demo seed",action:"Workspace initialized",detail:"Fictional India response dataset loaded. No agency affiliation." }] };
    }
    function validWorkspace(candidate) {
      const collections = ["crises","resources","requests","users","messages","notifications","attachments","decisions","negotiations","simulations","audit"];
      if (!candidate || candidate.version !== 3 || !collections.every((key) => Array.isArray(candidate[key]) && candidate[key].every((entry) => entry && typeof entry === "object")) || !candidate.preferences || !candidate.crises.length || !candidate.resources.length) return false;
      const crisesValid = candidate.crises.every((crisis) => crisis && typeof crisis.id === "string" && typeof crisis.title === "string" && typeof crisis.city === "string" && typeof crisis.region === "string" && Number.isFinite(crisis.lat) && Number.isFinite(crisis.lng) && integer(crisis.severity,1,5) !== null && ["active","escalating","resolved"].includes(crisis.status) && Array.isArray(crisis.timeline) && crisis.timeline.every((entry) => entry && typeof entry === "object") && typeof crisis.createdAt === "string");
      if (!crisesValid) return false;
      const resourcesValid = candidate.resources.every((resource) => resource && typeof resource.id === "string" && typeof resource.name === "string" && typeof resource.unit === "string" && integer(resource.total,1) !== null && Array.isArray(resource.allocations) && Array.isArray(resource.history) && resource.history.every((entry) => entry && typeof entry === "object") && Array.isArray(resource.maintenanceLog) && resource.maintenanceLog.every((entry) => entry && typeof entry === "object") && resource.allocations.every((allocation) => allocation && integer(allocation.quantity,1) !== null && candidate.crises.some((crisis) => crisis.id === allocation.crisisId)) && resource.allocations.reduce((sum,allocation) => sum+allocation.quantity,0) <= resource.total);
      if (!resourcesValid) return false;
      const requestsValid = candidate.requests.every((request) => request && integer(request.quantity) !== null && candidate.crises.some((crisis) => crisis.id === request.crisisId) && candidate.resources.some((resource) => resource.id === request.resourceId));
      const usersValid = candidate.users.every((user) => roleNames[user.role] && typeof user.name === "string" && typeof user.email === "string" && typeof user.organization === "string");
      const notesValid = candidate.negotiations.every((entry) => ["pending","resolved"].includes(entry.status) && typeof entry.proposal === "string");
      return requestsValid && usersValid && notesValid;
    }
    let db;
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "null");
      db = validWorkspace(stored) ? stored : seedWorkspace();
    } catch { db = seedWorkspace(); demoStorageAvailable = false; }
    const esc = (value) => String(value ?? "").replace(/[&<>"']/g,(character) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[character]));
    const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
    const fmt = (value) => new Intl.NumberFormat("en-IN").format(value);
    const money = (value) => `INR ${fmt(Math.round(value))}`;
    const when = (value) => new Date(value).toLocaleString("en-IN",{ day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"Asia/Kolkata" });
    const shortTime = (value) => new Date(value).toLocaleTimeString("en-IN",{ hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"Asia/Kolkata" });
    const crisisById = (id) => db.crises.find((item) => item.id === id);
    const resourceById = (id) => db.resources.find((item) => item.id === id);
    const used = (resource) => resource.allocations.reduce((sum,item) => sum + Number(item.quantity),0);
    const available = (resource) => resource.maintenance ? 0 : Math.max(0,resource.total - used(resource));
    const openCrises = () => db.crises.filter((item) => item.status !== "resolved");
    const resourceRequests = (id) => db.requests.filter((item) => item.resourceId === id && item.quantity > 0 && crisisById(item.crisisId)?.status !== "resolved");
    const has = (action) => {
      const permissions = { crisis:["admin","crisis-manager"],resource:["admin","resource-coordinator"],allocate:["admin","crisis-manager","resource-coordinator"],approve:["admin","crisis-manager"],users:["admin"],message:["admin","crisis-manager","resource-coordinator"],save:["admin","crisis-manager","resource-coordinator"] };
      return (permissions[action] || []).includes(ui.role);
    };
    const disabled = (action) => has(action) ? "" : ' disabled title="This action is not available to the current demo role"';
    function showToast(text) {
      clearTimeout(toastTimer);
      const toast = $("#workToast");
      toast.textContent = text;
      toast.hidden = false;
      toastTimer = setTimeout(() => toast.hidden = true,4500);
    }
    function requireRole(action) {
      if (has(action)) return true;
      showToast("Your current demo role cannot make that change. Use the role preview to explore permissions.");
      return false;
    }
    function record(action,detail) {
      db.audit.unshift({ id:uid("A"),at:new Date().toISOString(),actor:actorNames[ui.role],action,detail });
      db.audit = db.audit.slice(0,200);
    }
    function notify(text) {
      db.notifications.unshift({ id:uid("N"),text,at:new Date().toISOString(),read:false,channel:"In-app demo" });
      db.notifications = db.notifications.slice(0,80);
    }
    function saveDb() {
      try { localStorage.setItem(storageKey,JSON.stringify(db)); }
      catch { demoStorageAvailable = false; }
    }
    function finishChange(text) { saveDb(); renderWorkspace(ui.module); showToast(text); }
    const selectedAttr = (a,b) => a === b ? " selected" : "";
    const statusLabel = (status) => `<span class="state-label ${esc(status)}">${esc(status.charAt(0).toUpperCase() + status.slice(1))}</span>`;
    const severityLabel = (severity) => `<span class="state-label ${severity >= 5 ? "critical" : severity >= 4 ? "high" : "moderate"}">${esc(severityNames[severity] || "Unspecified")}</span>`;
    const roleOptions = (role) => Object.entries(roleNames).map(([value,label]) => `<option value="${value}"${selectedAttr(value,role)}>${label}</option>`).join("");
    const crisisOptions = (chosen = "") => openCrises().map((item) => `<option value="${esc(item.id)}"${selectedAttr(item.id,chosen)}>${esc(item.city)} / ${esc(item.title)}</option>`).join("");
    const resourceOptions = (chosen = "") => db.resources.map((item) => `<option value="${esc(item.id)}"${selectedAttr(item.id,chosen)}>${esc(item.name)} (${available(item)} available)</option>`).join("");
    function capabilityScope(module) {
      if (!module) return "";
      return `<details class="module-scope"><summary>Included in ${esc(module.name)} <span aria-hidden="true">+</span></summary><ul>${module.features.map((feature) => `<li>${esc(feature)}</li>`).join("")}</ul></details>`;
    }
    function metrics() {
      const pools = db.resources.filter((resource) => !resource.maintenance);
      const utilization = pools.length ? Math.round(pools.reduce((sum,resource) => sum + used(resource) / resource.total * 100,0) / pools.length) : 0;
      const times = db.crises.filter((item) => Number.isFinite(item.responseMinutes));
      return { active:openCrises().length,conflicts:db.resources.filter((resource) => resourceRequests(resource.id).reduce((sum,request) => sum + request.quantity,0) > available(resource)).length,utilization,response:times.length ? Math.round(times.reduce((sum,item) => sum + item.responseMinutes,0) / times.length) : 0 };
    }
    function statLine(items) {
      return `<div class="overview-stats">${items.map(([value,label]) => `<div class="overview-stat"><b>${esc(value)}</b><span>${esc(label)}</span></div>`).join("")}</div>`;
    }
    function overviewView() {
      const stats = metrics();
      const escalating = openCrises().filter((crisis) => crisis.status === "escalating");
      const pools = pressuredPools();
      const unread = db.notifications.filter((notice) => !notice.read).length;
      const icon = (path) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
      const chevron = icon('<path d="m9 6 6 6-6 6"/>');
      const items = [
        ...escalating.map((crisis) => `<li><button type="button" data-crisis-detail="${esc(crisis.id)}"><i class="ws-dot critical"></i><span><b>${esc(crisis.title)}</b><small>${esc(crisis.city)}, ${esc(crisis.region)} · Escalating · ${esc(severityNames[crisis.severity])} severity</small></span>${chevron}</button></li>`),
        ...pools.map((resource) => {
          const demand = resourceRequests(resource.id).reduce((sum,request) => sum + request.quantity,0);
          return `<li><button type="button" data-panel="conflicts"><i class="ws-dot high"></i><span><b>${esc(resource.name)}</b><small>${fmt(demand)} ${esc(resource.unit)} requested · ${fmt(available(resource))} available</small></span>${chevron}</button></li>`;
        }),
      ];
      if (unread) items.push(`<li><button type="button" data-open-notices><i class="ws-dot"></i><span><b>${unread} unread notification${unread === 1 ? "" : "s"}</b><small>Messages &amp; files</small></span>${chevron}</button></li>`);
      const quick = [
        ["crisis","New crisis","crisis",'<path d="M12 5v14M5 12h14"/>'],
        ["assign","Assign resources","allocate",'<path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4v-9Z"/><path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9"/>'],
        ["request","Log a request","allocate",'<path d="M4 7h12l-3-3M20 17H8l3 3"/>'],
        ["message","Post an update","message",'<path d="M4 5h16v11H9l-5 4V5Z"/>'],
        ["report","Export a report",null,'<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>'],
      ];
      return `<div class="overview-stats">
        <div class="overview-stat"><span>Active incidents</span><b>${stats.active}</b><small>${escalating.length} escalating</small></div>
        <div class="overview-stat"><span>Resource conflicts</span><b>${stats.conflicts}</b><small>Pools short of demand</small></div>
        <div class="overview-stat"><span>Pool utilization</span><b>${stats.utilization}%</b><small>Average across pools</small></div>
        <div class="overview-stat"><span>Avg. response</span><b>${stats.response} min</b><small>From sample records</small></div>
      </div>
      <div class="ws-grid-2">
        <section class="ws-card"><div class="ws-card-head"><h3>Needs attention</h3><span>${items.length} item${items.length === 1 ? "" : "s"}</span></div>${items.length ? `<ul class="ws-attention">${items.join("")}</ul>` : '<p class="work-empty">Nothing needs attention right now.</p>'}</section>
        <section class="ws-card"><div class="ws-card-head"><h3>Quick actions</h3></div><div class="ws-quick">${quick.map(([id,label,permission,path]) => `<button type="button" data-quick="${id}"${permission ? disabled(permission) : ""}>${icon(path)}<span>${label}</span></button>`).join("")}</div></section>
      </div>
      <section class="ws-card"><div class="ws-card-head"><h3>Recent activity</h3><button type="button" class="ws-link" data-panel="users">View full log</button></div>${auditList(db.audit.slice(0,6))}</section>`;
    }
    function auditList(entries) {
      return entries.length ? `<ul class="decision-list">${entries.map((entry) => `<li><small>${esc(when(entry.at))} IST / ${esc(entry.actor)}</small><b>${esc(entry.action)}</b><br>${esc(entry.detail)}</li>`).join("")}</ul>` : '<p class="work-empty">No recorded activity yet.</p>';
    }
    function filteredCrises() {
      return db.crises.filter((item) => (ui.crisisFilter === "all" || item.status === ui.crisisFilter) && `${item.title} ${item.city} ${item.region} ${item.category}`.toLowerCase().includes(ui.crisisQuery.toLowerCase()));
    }
    function crisisRows() {
      const rows = filteredCrises();
      return rows.length ? rows.map((item) => `<tr><td><button class="row-link" type="button" data-crisis-detail="${esc(item.id)}">${esc(item.title)}</button><small>${esc(item.id)} / ${esc(item.category)}</small></td><td>${esc(item.city)}<small>${esc(item.region)}</small></td><td>${severityLabel(item.severity)}</td><td>${statusLabel(item.status)}</td><td><button class="work-btn" type="button" data-crisis-detail="${esc(item.id)}">Open record ↗</button></td></tr>`).join("") : '<tr><td colspan="5" class="work-empty">No crises match those filters.</td></tr>';
    }
    function crisisDetail(item) {
      if (!item) return "";
      const assigned = db.resources.flatMap((resource) => resource.allocations.filter((allocation) => allocation.crisisId === item.id).map((allocation) => `${allocation.quantity} ${resource.unit} / ${resource.name}`));
      return `<section class="module-detail"><div class="detail-heading"><div><h3>${esc(item.title)}</h3><small>${esc(item.city)}, ${esc(item.region)} / ${item.lat.toFixed(3)}, ${item.lng.toFixed(3)}</small></div><button type="button" data-hide-crisis>Hide record ×</button></div><div class="details-grid"><div><p class="detail-note">${fmt(item.population)} people in the illustrative impact estimate. ${esc(item.category)} / ${esc(severityNames[item.severity])}. All sample records are fictional.</p><div class="detail-controls"><label class="overline" for="crisisStatus">Status</label><select class="work-select" id="crisisStatus" data-crisis-status="${esc(item.id)}"${disabled("crisis")}>${["active","escalating","resolved"].map((status) => `<option value="${status}"${selectedAttr(status,item.status)}>${status[0].toUpperCase()+status.slice(1)}</option>`).join("")}</select><a class="work-btn" href="https://www.openstreetmap.org/?mlat=${item.lat}&mlon=${item.lng}#map=11/${item.lat}/${item.lng}" target="_blank" rel="noopener noreferrer">View geographic map ↗</a></div><h4 class="section-title">Assigned resources</h4><p class="detail-note">${assigned.length ? assigned.map(esc).join("<br>") : "No resources assigned to this incident."}</p><button class="text-action" type="button" data-discuss="${esc(item.id)}">Open incident comments ↗</button></div><div><p class="overline" style="margin-bottom:12px">Events & actions / IST</p><ol class="timeline">${item.timeline.slice(0,8).map((event) => `<li><time>${esc(shortTime(event.at))}</time><span>${esc(event.text)}<br><span style="color:var(--dim)">${esc(event.actor)}</span></span></li>`).join("")}</ol></div></div></section>`;
    }
    function crisisMap() {
      const visible = filteredCrises();
      const pins = visible.map((item) => `<button type="button" class="map-pin ${item.status}${ui.selectedCrisis === item.id ? " selected" : ""}" style="left:${clamp((item.lng-67)/31*100,4,96)}%;top:${clamp((37-item.lat)/31*100,8,92)}%" data-crisis-detail="${esc(item.id)}" aria-label="${esc(item.title)} in ${esc(item.city)}">${String(db.crises.indexOf(item)+1).padStart(2,"0")}</button>`).join("");
      return `<div class="geo-map" aria-label="Schematic geographic positions of Indian training incidents">
        <svg viewBox="0 0 600 360" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="geoGrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0v40" fill="none" stroke="#52634c" stroke-opacity=".22" stroke-width="1"/></pattern></defs><rect width="600" height="360" fill="url(#geoGrid)"/><path d="M40 292C90 195 135 182 186 95S283 24 386 56 460 109 566 153M70 331C170 222 269 230 351 157S434 107 598 140" fill="none" stroke="#32492f" stroke-width="1"/><text x="20" y="30" fill="#91a28b" font-family="Inter, sans-serif" font-size="9" letter-spacing="2">INDIA / DEMO FOOTPRINT</text><text x="20" y="341" fill="#687762" font-family="Inter, sans-serif" font-size="8">6°N — 37°N / 67°E — 98°E</text></svg>${pins}
      </div><p class="map-footnote">${visible.length} matching incidents. Positions are plotted from demo coordinates. This schematic has no political boundaries and is not a navigation map. Open an incident for its geographic map link.</p>`;
    }
    function crisesView() {
      return `<div class="workspace-tools"><div><input class="work-input search-field" id="crisisSearch" type="search" placeholder="Search incidents or locations" value="${esc(ui.crisisQuery)}" aria-label="Search incidents"><select class="work-select" id="crisisFilter" aria-label="Filter incident status">${["all","active","escalating","resolved"].map((status) => `<option value="${status}"${selectedAttr(status,ui.crisisFilter)}>${status === "all" ? "All statuses" : status[0].toUpperCase()+status.slice(1)}</option>`).join("")}</select></div><button type="button" class="work-btn primary" data-toggle-form="newCrisis"${disabled("crisis")}>Create crisis +</button></div><form class="work-form inline-form" id="newCrisis" data-work-form="crisis" hidden><h3>Create a training incident</h3><div class="work-form-grid"><label class="full">Crisis name<input class="work-input" name="title" required maxlength="90" placeholder="District flood-response exercise"></label><label>City / district<input class="work-input" name="city" required maxlength="60" placeholder="Mumbai"></label><label>State / region<input class="work-input" name="region" required maxlength="60" placeholder="Maharashtra"></label><label>Category<select class="work-select" name="category">${["Flood","Fire","Medical","Landslide","Storm","Earthquake","Other"].map((category) => `<option>${category}</option>`).join("")}</select></label><label>Severity<select class="work-select" name="severity">${[5,4,3,2,1].map((severity) => `<option value="${severity}">${severityNames[severity]}</option>`).join("")}</select></label><label>Latitude<input class="work-input" name="lat" type="number" min="6" max="37" step=".0001" required value="19.076"></label><label>Longitude<input class="work-input" name="lng" type="number" min="67" max="98" step=".0001" required value="72.8777"></label><label>Estimated people affected<input class="work-input" name="population" type="number" min="0" max="1000000" step="1" value="0" required></label><label>Initial status<select class="work-select" name="status"><option value="active">Active</option><option value="escalating">Escalating</option></select></label></div><div class="form-actions"><button class="work-btn primary" type="submit">Create training incident</button><button class="work-btn" type="button" data-toggle-form="newCrisis">Cancel</button><p>Use fictional information only.</p></div></form><div class="work-tabs" aria-label="Crisis display"><button type="button" data-crisis-tab="list" class="${ui.crisisTab === "list" ? "is-active" : ""}" aria-pressed="${ui.crisisTab === "list"}">Incident list</button><button type="button" data-crisis-tab="map" class="${ui.crisisTab === "map" ? "is-active" : ""}" aria-pressed="${ui.crisisTab === "map"}">Geographic view</button></div>${ui.crisisTab === "map" ? crisisMap() : `<div class="table-scroll"><table class="work-table"><thead><tr><th>Incident</th><th>Location</th><th>Severity</th><th>Status</th><th>Record</th></tr></thead><tbody id="crisisRows">${crisisRows()}</tbody></table></div>`}${crisisDetail(crisisById(ui.selectedCrisis))}`;
    }

    function resourceRows() {
      const rows = db.resources.filter((resource) => (ui.resourceFilter === "all" || resource.type === ui.resourceFilter) && `${resource.name} ${resource.organization} ${resource.capability}`.toLowerCase().includes(ui.resourceQuery.toLowerCase()));
      return rows.length ? rows.map((resource) => `<tr><td><button type="button" class="row-link" data-resource-detail="${esc(resource.id)}">${esc(resource.name)}</button><small>${esc(resource.type)} / ${esc(resource.organization)}</small></td><td>${fmt(resource.total)}<small>${esc(resource.unit)}</small></td><td>${resource.maintenance ? statusLabel("maintenance") : `${fmt(available(resource))}<small>${used(resource)} assigned</small>`}</td><td><div class="capacity-bar" style="min-width:65px"><i style="width:${resource.maintenance ? 0 : Math.min(100,used(resource)/resource.total*100)}%"></i></div><small>${resource.maintenance ? "Out of service" : `${Math.round(used(resource)/resource.total*100)}% utilized`}</small></td><td><button type="button" class="work-btn" data-resource-detail="${esc(resource.id)}">Profile ↗</button></td></tr>`).join("") : '<tr><td colspan="5" class="work-empty">No matching resources.</td></tr>';
    }
    function resourceDetail(resource) {
      if (!resource) return "";
      return `<section class="module-detail"><div class="detail-heading"><div><h3>${esc(resource.name)}</h3><small>${esc(resource.id)} / ${esc(resource.type)} / ${esc(resource.organization)}</small></div><button type="button" data-hide-resource>Hide profile ×</button></div><div class="details-grid"><div><p class="detail-note">${esc(resource.capability)}</p><p class="detail-note" style="margin-top:10px">Indicative daily cost per ${esc(resource.unit)}: ${money(resource.cost)}. Fictional costing only.</p><div class="detail-controls"><button type="button" class="work-btn" data-maintenance="${esc(resource.id)}"${disabled("resource")}>${resource.maintenance ? "Return to available" : "Mark for maintenance"}</button></div><h4 class="section-title">Current assignments</h4><ul class="decision-list">${resource.allocations.length ? resource.allocations.map((allocation) => `<li><small>${esc(when(allocation.at))} IST</small>${fmt(allocation.quantity)} ${esc(resource.unit)} / ${esc(crisisById(allocation.crisisId)?.title || "Unknown incident")}<br><button class="text-action" type="button" data-release="${esc(resource.id)}" data-release-crisis="${esc(allocation.crisisId)}"${disabled("allocate")}>Release assignment ↗</button></li>`).join("") : '<li>No active assignments.</li>'}</ul></div><div><p class="overline" style="margin-bottom:10px">Usage history</p><ol class="timeline">${resource.history.slice(0,5).map((event) => `<li><time>${esc(shortTime(event.at))}</time><span>${esc(event.text)}<br><span style="color:var(--dim)">${esc(event.actor)}</span></span></li>`).join("")}</ol><p class="overline" style="margin:22px 0 10px">Maintenance log</p><ol class="timeline">${resource.maintenanceLog.slice(0,4).map((event) => `<li><time>${esc(shortTime(event.at))}</time><span>${esc(event.text)}</span></li>`).join("")}</ol></div></div></section>`;
    }
    function resourcesView() {
      return `<div class="workspace-tools"><div><input class="work-input search-field" id="resourceSearch" type="search" placeholder="Search resource inventory" value="${esc(ui.resourceQuery)}" aria-label="Search inventory"><select class="work-select" id="resourceFilter" aria-label="Filter resource type"><option value="all">All resource types</option>${["Personnel","Equipment","Supplies","Facilities"].map((type) => `<option${selectedAttr(type,ui.resourceFilter)}>${type}</option>`).join("")}</select></div><div><button type="button" class="work-btn" data-toggle-form="assignResource"${disabled("allocate")}>Assign resources ↗</button><button type="button" class="work-btn primary" data-toggle-form="newResource"${disabled("resource")}>Add resource +</button></div></div><form class="work-form inline-form" id="newResource" data-work-form="resource" hidden><h3>Add an inventory pool</h3><div class="work-form-grid"><label>Resource name<input class="work-input" name="name" required maxlength="80" placeholder="District rescue vehicles"></label><label>Type<select class="work-select" name="type">${["Personnel","Equipment","Supplies","Facilities"].map((type) => `<option>${type}</option>`).join("")}</select></label><label>Total capacity<input class="work-input" name="total" type="number" min="1" max="1000000" step="1" required value="5"></label><label>Unit name<input class="work-input" name="unit" required maxlength="30" placeholder="vehicles"></label><label>Organization<input class="work-input" name="organization" required maxlength="70" placeholder="Training response collective"></label><label>Daily unit cost / INR<input class="work-input" name="cost" type="number" min="0" max="10000000" step="1" required value="1000"></label><label class="full">Capabilities and specifications<textarea class="work-input" name="capability" required maxlength="350" rows="2" placeholder="Capacity, qualifications, operating constraints, readiness..."></textarea></label></div><div class="form-actions"><button type="submit" class="work-btn primary">Add inventory pool</button><button type="button" class="work-btn" data-toggle-form="newResource">Cancel</button></div></form><form class="work-form inline-form" id="assignResource" data-work-form="assign" hidden><h3>Assign available capacity</h3><div class="work-form-grid"><label>Resource<select name="resourceId" class="work-select" required>${resourceOptions()}</select></label><label>Active crisis<select name="crisisId" class="work-select" required>${crisisOptions()}</select></label><label>Quantity<input name="quantity" class="work-input" type="number" min="1" max="1000000" value="1" step="1" required></label><label>Assignment rationale<input name="reason" class="work-input" required maxlength="220" placeholder="Agreed operational need"></label></div><div class="form-actions"><button type="submit" class="work-btn primary">Confirm demo assignment</button><button type="button" class="work-btn" data-toggle-form="assignResource">Cancel</button></div></form><div class="table-scroll"><table class="work-table"><thead><tr><th>Resource / organization</th><th>Capacity</th><th>Available</th><th>Utilization</th><th>Details</th></tr></thead><tbody id="resourceRows">${resourceRows()}</tbody></table></div>${resourceDetail(resourceById(ui.selectedResource))}`;
    }

    // The deterministic demo heuristic is transparent, not a clinical or life-saving model.
    function recommendation(resource,capacity = available(resource),severityWeight = 65) {
      const ranked = resourceRequests(resource.id).map((request) => {
        const crisis = crisisById(request.crisisId);
        const readiness = Math.max(0,60 - (crisis.responseMinutes ?? 30)) / 60;
        const score = Math.round(crisis.severity / 5 * severityWeight + readiness * (100 - severityWeight));
        return { ...request,crisis,score };
      }).sort((a,b) => b.score-a.score || a.crisis.createdAt.localeCompare(b.crisis.createdAt));
      let remaining = Math.max(0,Math.floor(capacity));
      return ranked.map((request) => {
        const allocation = Math.min(request.quantity,remaining);
        remaining -= allocation;
        return { ...request,allocation };
      });
    }
    function pressuredPools() {
      return db.resources.filter((resource) => resourceRequests(resource.id).reduce((sum,item) => sum+item.quantity,0) > available(resource));
    }
    function requestQueue() {
      const pools = db.resources.filter((resource) => resourceRequests(resource.id).length);
      if (!pools.length) return "";
      const count = pools.reduce((sum,resource) => sum+resourceRequests(resource.id).length,0);
      return `<details class="module-scope"><summary>Open request queue (${count} requests) <span aria-hidden="true">+</span></summary><div class="table-scroll"><table class="work-table"><thead><tr><th>Pool</th><th>Pending requests</th><th>Available</th><th>Approval</th></tr></thead><tbody>${pools.map((resource) => `<tr><td>${esc(resource.name)}<small>${resourceRequests(resource.id).map((request) => `${esc(crisisById(request.crisisId).city)}: ${request.quantity}`).join(" / ")}</small></td><td>${resourceRequests(resource.id).reduce((sum,request) => sum+request.quantity,0)} ${esc(resource.unit)}</td><td>${available(resource)} ${esc(resource.unit)}</td><td><button type="button" class="work-btn" data-approve-pool="${esc(resource.id)}"${!has("approve") || available(resource) === 0 ? " disabled" : ""}>Approve available capacity</button></td></tr>`).join("")}</tbody></table></div></details>`;
    }
    function conflictsView() {
      const pools = pressuredPools();
      const chosen = resourceById(ui.conflictResource) || pools[0] || db.resources[0];
      return `<div class="workspace-tools"><div><span class="state-label critical">${pools.length} pools under demand pressure</span></div><div><button type="button" class="work-btn" data-toggle-form="newRequest"${disabled("allocate")}>Add a competing request +</button><button type="button" class="work-btn" data-recalculate>Recalculate priorities ↻</button></div></div><p class="demo-notice">Suggestions are ranked by severity (65%) and sample response time (35%), and never exceed what's actually available. A person always makes the final call.</p><form class="work-form inline-form" id="newRequest" data-work-form="request" hidden><h3>Add a resource request</h3><div class="work-form-grid"><label>Resource pool<select name="resourceId" class="work-select" required>${resourceOptions(chosen.id)}</select></label><label>Active crisis<select name="crisisId" class="work-select" required>${crisisOptions()}</select></label><label>Additional requested quantity<input name="quantity" class="work-input" type="number" min="1" max="1000000" step="1" value="2" required></label><label>Reason<input name="reason" class="work-input" required maxlength="200" placeholder="Unmet operational demand"></label></div><div class="form-actions"><button type="submit" class="work-btn primary">Record request</button><button type="button" class="work-btn" data-toggle-form="newRequest">Cancel</button></div></form>${pools.length ? pools.map((resource) => {
        const plan = recommendation(resource), demand = plan.reduce((sum,item) => sum+item.quantity,0);
        return `<section class="conflict-item"><div class="conflict-top"><div><h3>${esc(resource.name)}</h3><p>${fmt(demand)} additional ${esc(resource.unit)} requested / ${fmt(available(resource))} available / ${plan.length > 1 ? "competing incidents" : "uncovered demand"}</p></div><button type="button" class="work-btn primary" data-approve-pool="${esc(resource.id)}"${!has("approve") || available(resource) === 0 ? " disabled" : ""}>Approve recommendation ↗</button></div>${plan.map((item) => `<div class="allocation-line"><span>${esc(item.crisis.city)} / ${esc(item.crisis.title)}</span><small>Score ${item.score}</small><div class="capacity-bar"><i style="width:${item.score}%"></i></div><b>${item.allocation} / ${item.quantity}</b></div>`).join("")}<p class="map-footnote">Proposed assignment / requested quantity. Shortfall: ${fmt(Math.max(0,demand-available(resource)))} ${esc(resource.unit)}. ${resource.maintenance ? "This pool is unavailable for maintenance." : "A manager or admin must approve."}</p></section>`;
      }).join("") : '<p class="work-empty">No current resource shortfalls. Add competing requests to explore the workflow.</p>'}<details class="ws-collapse"><summary>Need something different?<small>Override the suggestion or propose a compromise</small><i aria-hidden="true">+</i></summary><form class="work-form" data-work-form="override"><div class="work-form-grid"><label>Resource pool<select name="resourceId" class="work-select" required>${resourceOptions(chosen.id)}</select></label><label>Active crisis<select name="crisisId" class="work-select" required>${crisisOptions()}</select></label><label>Quantity to allocate<input name="quantity" class="work-input" type="number" min="1" max="1000000" step="1" value="1" required></label><label>Recorded override reason<input name="reason" class="work-input" required minlength="8" maxlength="250" placeholder="Explain why the recommendation should change"></label></div><div class="form-actions"><button type="submit" class="work-btn"${disabled("approve")}>Record override &amp; allocate</button><p>Capacity limits still apply.</p></div></form><form class="work-form" data-work-form="negotiation"><div class="work-form-grid"><label>Resource<select name="resourceId" class="work-select">${resourceOptions(chosen.id)}</select></label><label>Compromise proposal<input name="proposal" class="work-input" required minlength="5" maxlength="350" placeholder="Share capacity now, arrange partner backfill later..."></label></div><div class="form-actions"><button type="submit" class="work-btn"${disabled("allocate")}>Log negotiation proposal</button></div></form></details>${db.negotiations.length ? `<ul class="decision-list" style="margin-top:20px">${db.negotiations.slice(0,6).map((entry) => `<li><small>${esc(when(entry.at))} IST / ${esc(entry.actor)} / ${esc(resourceById(entry.resourceId)?.name)}</small>${esc(entry.proposal)}<div class="detail-controls">${statusLabel(entry.status)}${entry.status === "pending" ? `<button type="button" class="work-btn" data-agree-negotiation="${esc(entry.id)}"${disabled("approve")}>Record agreement</button>` : ""}</div></li>`).join("")}</ul>` : ""}<h3 class="section-title">Decision record</h3>${db.decisions.length ? `<ul class="decision-list">${db.decisions.slice(0,8).map((decision) => `<li><small>${esc(when(decision.at))} IST / ${esc(decision.actor)} / ${esc(decision.type)}</small>${esc(decision.text)}</li>`).join("")}</ul>` : '<p class="work-empty">Approve a recommendation or record an override to create a decision record and local stakeholder notice.</p>'}`;
    }

    function usersView() {
      return `<div class="workspace-tools"><div><span class="module-count">${db.users.length} demo users / ${new Set(db.users.map((user) => user.organization)).size} organizations</span></div><button type="button" class="work-btn primary" data-toggle-form="newUser"${disabled("users")}>Prepare local invitation +</button></div><p class="workspace-warning">The "View as" switch only previews what each role can see — it isn't a real sign-in. A live deployment would use your organization's own accounts.</p><form class="work-form inline-form" id="newUser" data-work-form="user" hidden><h3>Prepare a demo invitation</h3><div class="work-form-grid"><label>Name<input name="name" class="work-input" required maxlength="65" placeholder="Priya Sen"></label><label>Email<input name="email" class="work-input" type="email" required maxlength="120" placeholder="priya@example.org"></label><label>Organization<input name="organization" class="work-input" required maxlength="75" placeholder="Training relief collective"></label><label>Role<select name="role" class="work-select">${roleOptions("viewer")}</select></label></div><div class="form-actions"><button type="submit" class="work-btn primary">Create local invitation record</button><button type="button" class="work-btn" data-toggle-form="newUser">Cancel</button><p>No email is sent. Use fictional identities.</p></div></form><div class="table-scroll"><table class="work-table"><thead><tr><th>User</th><th>Organization</th><th>Role</th><th>Access status</th></tr></thead><tbody>${db.users.map((user) => `<tr><td>${esc(user.name)}<small>${esc(user.email)}</small></td><td>${esc(user.organization)}</td><td><select class="work-select" data-user-role="${esc(user.id)}" aria-label="Demo role for ${esc(user.name)}"${disabled("users")}>${roleOptions(user.role)}</select></td><td>${esc(user.status)}</td></tr>`).join("")}</tbody></table></div><details class="ws-collapse"><summary>What each role can do<i aria-hidden="true">+</i></summary><div class="table-scroll"><table class="role-matrix"><thead><tr><th>Action</th><th>Admin</th><th>Crisis manager</th><th>Resource coordinator</th><th>Viewer</th></tr></thead><tbody><tr><td>View incidents &amp; reports</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr><tr><td>Create &amp; update crises</td><td>Yes</td><td>Yes</td><td>—</td><td>—</td></tr><tr><td>Edit inventory &amp; maintenance</td><td>Yes</td><td>—</td><td>Yes</td><td>—</td></tr><tr><td>Assign available resources</td><td>Yes</td><td>Yes</td><td>Yes</td><td>—</td></tr><tr><td>Approve or override priorities</td><td>Yes</td><td>Yes</td><td>—</td><td>—</td></tr><tr><td>Manage users &amp; roles</td><td>Yes</td><td>—</td><td>—</td><td>—</td></tr></tbody></table></div></details><h3 class="section-title">Activity audit log</h3>${auditList(db.audit.slice(0,12))}`;
    }

    function channelOptions(chosen) {
      return `<option value="network"${selectedAttr(chosen,"network")}>Network coordination</option><option value="decisions"${selectedAttr(chosen,"decisions")}>Decision discussion</option>${db.crises.map((crisis) => `<option value="${esc(crisis.id)}"${selectedAttr(chosen,crisis.id)}>Incident / ${esc(crisis.city)} / ${esc(crisis.title)}</option>`).join("")}`;
    }
    function collaborationView() {
      const tabs = [["messages","Messages & comments"],["notifications",`Notifications (${db.notifications.filter((item) => !item.read).length})`],["documents","Documents"]];
      const top = `<div class="workspace-tools"><div class="work-tabs" aria-label="Collaboration sections">${tabs.map(([id,label]) => `<button type="button" data-communication-tab="${id}" class="${ui.communicationTab === id ? "is-active" : ""}" aria-pressed="${ui.communicationTab === id}">${esc(label)}</button>`).join("")}</div></div>`;
      if (ui.communicationTab === "notifications") {
        return `${top}<p class="demo-notice">Only in-app demo notices are recorded. Email, SMS, and push below are intended delivery preferences; no external provider is connected and nothing is sent.</p><div class="channel-settings">${[["email","Email"],["sms","SMS"],["push","Push"]].map(([key,label]) => `<label><input type="checkbox" data-notification-pref="${key}"${db.preferences[key] ? " checked" : ""}${disabled("save")}>${label} preference</label>`).join("")}</div><button type="button" class="work-btn" data-mark-notifications>Mark local notices as read</button><ul class="messages">${db.notifications.length ? db.notifications.map((notice) => `<li><div class="message-head"><span>${notice.read ? "Read" : "Unread"} / ${esc(notice.channel)}</span><small>${esc(when(notice.at))} IST</small></div><p>${esc(notice.text)}</p></li>`).join("") : '<li class="work-empty">No notices yet. Update a crisis or approve an allocation.</li>'}</ul>`;
      }
      const channelPicker = `<div class="workspace-tools"><div><label class="overline" for="messageChannel">Thread</label><select id="messageChannel" class="work-select" aria-label="Select a collaboration thread">${channelOptions(ui.channel)}</select></div></div>`;
      if (ui.communicationTab === "documents") {
        const documents = db.attachments.filter((file) => file.channel === ui.channel);
        return `${top}${channelPicker}<p class="demo-notice">Files remain in this browser session. Only attachment metadata is kept with the demo; reattach a file after a page reload. No document is uploaded to a server.</p><form class="work-form inline-form" data-work-form="attachment"><div class="work-form-grid"><label class="full">Attach a training document<input name="file" id="workFile" class="work-input" type="file" required accept=".pdf,.csv,.txt,.json,.png,.jpg,.jpeg"${disabled("message")}></label></div><div class="form-actions"><button type="submit" class="work-btn primary"${disabled("message")}>Attach to this thread</button><p>PDF, CSV, text, JSON, PNG, JPG. Maximum 5 MB. No sensitive data.</p></div></form><ul class="file-list">${documents.length ? documents.map((file) => `<li><div>${esc(file.name)}<small>${fmt(Math.ceil(file.size/1024))} KB / ${esc(file.author)} / ${esc(when(file.at))} IST</small></div>${attachmentsInSession.has(file.id) ? `<button type="button" class="work-btn" data-download-attachment="${esc(file.id)}">Download ↗</button>` : '<span class="module-count">Session file unavailable</span>'}</li>`).join("") : '<li class="work-empty">No documents attached to this thread yet.</li>'}</ul>`;
      }
      const messages = db.messages.filter((message) => message.channel === ui.channel);
      return `${top}${channelPicker}<ul class="messages">${messages.length ? messages.map((message) => `<li><div class="message-head"><span>${esc(message.author)}</span><small>${esc(when(message.at))} IST</small></div><p>${esc(message.text)}</p><div class="message-meta">${ui.channel === "network" ? "Network message" : ui.channel === "decisions" ? "Decision comment" : "Incident comment"} / local demo</div></li>`).join("") : '<li class="work-empty">Start a conversation in this thread. No live stakeholders are connected.</li>'}</ul><form class="work-form" data-work-form="message" style="margin-top:25px"><label>Message / comment<textarea name="text" class="work-input" rows="3" required minlength="2" maxlength="1200" placeholder="Share a fictional update, question, or decision rationale..."${disabled("message")}></textarea></label><div class="form-actions"><button type="submit" class="work-btn primary"${disabled("message")}>Post local message ↗</button><p>Same-browser tabs share updates when local storage is available. This is not network real-time messaging.</p></div></form>`;
    }

    function periodCrises() {
      const cutoff = Date.now() - ui.analyticsDays * 86400000;
      return db.crises.filter((crisis) => new Date(crisis.createdAt).getTime() >= cutoff);
    }
    function utilizationRows() {
      return ["Personnel","Equipment","Supplies","Facilities"].map((type) => {
        const pools = db.resources.filter((resource) => resource.type === type && !resource.maintenance);
        const percent = pools.length ? Math.round(pools.reduce((sum,resource) => sum+used(resource)/resource.total*100,0)/pools.length) : 0;
        return `<div class="util-row"><span>${type}</span><div class="capacity-bar"><i style="width:${percent}%"></i></div><span>${percent}%</span></div>`;
      }).join("");
    }
    function trendSvg() {
      const days = Math.min(ui.analyticsDays,14), counts = [];
      for (let index = days-1; index >= 0; index--) {
        const start = new Date(); start.setHours(0,0,0,0); start.setDate(start.getDate()-index);
        const end = start.getTime()+86400000;
        counts.push(db.crises.filter((crisis) => new Date(crisis.createdAt).getTime() >= start.getTime() && new Date(crisis.createdAt).getTime() < end).length);
      }
      const max = Math.max(1,...counts);
      const points = counts.map((count,index) => `${35+index/(days-1)*420},${205-count/max*145}`).join(" ");
      return `<svg class="trend-chart" viewBox="0 0 490 255" role="img" aria-label="Training incidents created over the last ${days} days: ${counts.join(", ")}"><path d="M35 60H455M35 130H455M35 205H455" fill="none" stroke="#33402e" stroke-width="1"/><polyline class="trend-line" points="${points}" fill="none" stroke="#b9c9b4" stroke-width="2"/>${counts.map((count,index) => `<circle cx="${35+index/(days-1)*420}" cy="${205-count/max*145}" r="3" fill="#b9c9b4"/>`).join("")}<g fill="#8c9386" font-family="Inter, sans-serif" font-size="8"><text x="35" y="235">${days} days ago</text><text x="432" y="235">Today</text><text x="15" y="64">${max}</text><text x="18" y="208">0</text></g></svg>`;
    }
    function analyticsView() {
      const crises = periodCrises(), times = crises.filter((crisis) => Number.isFinite(crisis.responseMinutes));
      const avg = times.length ? Math.round(times.reduce((sum,crisis) => sum+crisis.responseMinutes,0)/times.length) : 0;
      return `<div class="workspace-tools"><div><select id="analyticsRange" class="work-select" aria-label="Reporting date range"><option value="7"${selectedAttr(ui.analyticsDays,7)}>Last 7 days</option><option value="30"${selectedAttr(ui.analyticsDays,30)}>Last 30 days</option></select></div><div><button type="button" class="work-btn" data-export="pdf">Export PDF ↓</button><button type="button" class="work-btn" data-export="excel">Export Excel ↓</button></div></div>${statLine([[crises.length,"Training incidents in range"],[crises.filter((crisis) => crisis.status === "resolved").length,"Resolved training incidents"],[`${metrics().utilization}%`,"Current mean pool utilization"],[`${avg} min`,"Mean recorded sample response"]])}<div class="analytics-grid"><section><div class="chart-heading"><h3>Incident trend</h3><small>Created events / ${Math.min(ui.analyticsDays,14)} days</small></div>${trendSvg()}<p class="map-footnote">Counts come from fictional and locally created training events. No live disaster trend is inferred.</p></section><section><div class="chart-heading"><h3>Resource utilization</h3><small>Current inventory</small></div>${utilizationRows()}<p class="map-footnote">Each category averages its non-maintenance pool percentages; different physical units are not summed.</p></section></div><h3 class="section-title">Response time by incident</h3><div class="table-scroll"><table class="work-table"><thead><tr><th>Training incident</th><th>Category</th><th>Status</th><th>Recorded response</th></tr></thead><tbody>${crises.length ? crises.map((crisis) => `<tr><td>${esc(crisis.title)}<small>${esc(crisis.city)}</small></td><td>${esc(crisis.category)}</td><td>${statusLabel(crisis.status)}</td><td>${Number.isFinite(crisis.responseMinutes) ? `${crisis.responseMinutes} min` : "Not yet recorded"}</td></tr>`).join("") : '<tr><td colspan="4" class="work-empty">No events in this date range.</td></tr>'}</tbody></table></div><p class="map-footnote">PDF is a native downloadable report. Excel export is a SpreadsheetML .xml workbook with separate incident, inventory, and audit sheets. Times are seeded examples or elapsed local-demo time to the first assignment.</p>`;
    }

    function decisionView() {
      const initial = resourceById("R-VENT") || db.resources[0];
      return `<p class="demo-notice">Scenarios are a safe sandbox: nothing here moves real inventory or dispatches anyone. Adjust the numbers and see how an allocation would land.</p><form class="work-form" data-work-form="simulation"><div class="scenario-controls"><label>Resource pool<select id="simulationPool" name="resourceId" class="work-select">${resourceOptions(initial.id)}</select></label><label>Scenario pool capacity<input name="capacity" id="simulationCapacity" type="number" min="0" max="1000000" step="1" value="${available(initial)}" required class="work-input"></label><label>Severity weight / <output id="severityWeightLabel">65%</output><input name="weight" id="severityWeight" type="range" min="20" max="90" step="5" value="65"></label><label>Cost per resource per day / INR<input name="cost" id="simulationCost" class="work-input" type="number" min="0" max="10000000" step="1" value="${initial.cost}" required></label></div><div class="form-actions"><button type="submit" class="work-btn primary">Run scenario ↗</button><p>The remaining score weight uses sample response-time readiness.</p></div></form><div id="simulationResult" class="scenario-result">${ui.simulation ? simulationResult(ui.simulation) : '<p class="work-empty">Adjust a scenario and run it to see proposed allocations, uncovered demand, and an indicative cost comparison.</p>'}</div><details class="ws-collapse"><summary>Saved scenarios<i aria-hidden="true">+</i></summary>${db.simulations.length ? `<ul class="decision-list">${db.simulations.slice(0,6).map((simulation) => `<li><small>${esc(when(simulation.at))} IST / ${esc(simulation.actor)}</small>${esc(simulation.resourceName)} / ${simulation.capacity} available / ${simulation.covered} proposed / ${simulation.demand-simulation.covered} uncovered / ${money(simulation.covered*simulation.cost)} indicative allocation cost</li>`).join("")}</ul>` : '<p class="work-empty">Nothing saved yet. Run a scenario and save it to keep the assumptions alongside the result.</p>'}</details>`;
    }
    function simulationResult(simulation) {
      const uncovered = Math.max(0,simulation.demand-simulation.covered);
      return `${statLine([[`${simulation.demand ? Math.round(simulation.covered/simulation.demand*100) : 0}%`,"Requested demand covered"],[simulation.covered,"Units proposed"],[uncovered,"Units still uncovered"],[money(simulation.covered*simulation.cost),"Indicative daily allocation cost"]])}<div class="table-scroll"><table class="work-table"><thead><tr><th>Training request</th><th>Priority score</th><th>Requested</th><th>Proposed</th></tr></thead><tbody>${simulation.rows.length ? simulation.rows.map((row) => `<tr><td>${esc(row.title)}<small>${esc(row.city)}</small></td><td>${row.score}</td><td>${row.quantity}</td><td>${row.allocation}</td></tr>`).join("") : '<tr><td colspan="4" class="work-empty">No open requests for this resource. Add requests in Conflict Resolution to compare scenarios.</td></tr>'}</tbody></table></div><p class="map-footnote">Assumptions: ${simulation.weight}% severity / ${100-simulation.weight}% sample response-time readiness. Pool cost at full use: ${money(simulation.capacity*simulation.cost)} per day. Unused scenario capacity: ${simulation.capacity-simulation.covered}. Coverage is not a clinical outcome measure.</p><div class="form-actions"><button type="button" class="work-btn" data-save-simulation${disabled("save")}>Save scenario to audit trail</button><button type="button" class="work-btn" data-simulation-conflict>Review live demo requests ↗</button></div>`;
    }
    function renderWorkspace(moduleId) {
      if (!moduleIds.includes(moduleId)) moduleId = "overview";
      const moduleChanged = ui.module !== moduleId;
      ui.module = moduleId;
      const module = featureModules.find((item) => item.id === moduleId);
      const views = { overview:overviewView,crises:crisesView,resources:resourcesView,conflicts:conflictsView,users:usersView,collaboration:collaborationView,analytics:analyticsView,decision:decisionView };
      const focusedElement = document.activeElement, previousId = focusedElement?.id;
      const selectionStart = focusedElement?.selectionStart;
      const title = module ? module.label : "Overview";
      const description = module ? module.description : "Where things stand right now, and what needs a decision.";
      const position = moduleIds.indexOf(moduleId);
      const labelOf = (id) => id === "overview" ? "Overview" : featureModules.find((item) => item.id === id).label;
      const previous = position > 0 ? moduleIds[position - 1] : null;
      const next = position < moduleIds.length - 1 ? moduleIds[position + 1] : null;
      const arrow = (path) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
      const left = arrow('<path d="m15 6-6 6 6 6"/>'), right = arrow('<path d="m9 6 6 6-6 6"/>');
      const steps = `<div class="ws-steps"><button type="button" class="ws-icon-btn"${previous ? ` data-panel="${previous}" aria-label="Previous: ${esc(labelOf(previous))}" title="Previous: ${esc(labelOf(previous))}"` : ' disabled aria-label="No previous page"'}>${left}</button><button type="button" class="ws-icon-btn"${next ? ` data-panel="${next}" aria-label="Next: ${esc(labelOf(next))}" title="Next: ${esc(labelOf(next))}"` : ' disabled aria-label="No next page"'}>${right}</button></div>`;
      const pager = `<nav class="ws-pager" aria-label="Workspace pages">${previous ? `<button type="button" class="ws-pager-btn" data-panel="${previous}">${left}<span><small>Previous</small>${esc(labelOf(previous))}</span></button>` : ""}${next ? `<button type="button" class="ws-pager-btn next" data-panel="${next}"><span><small>Next</small>${esc(labelOf(next))}</span>${right}</button>` : `<button type="button" class="ws-pager-btn next" data-panel="overview"><span><small>Back to</small>Overview</span>${right}</button>`}</nav>`;
      const content = `<div class="module-head"><div><h2 id="workspaceTitle" tabindex="-1">${esc(title)}</h2><p>${esc(description)}</p></div>${steps}</div>${views[moduleId]()}`
        .replace(/\s*↗/g,"")
        .replace(/ \+(?=<\/button>)/g,"");
      $("#workspaceContent").innerHTML = content + pager;
      $$(".workspace-sidebar [data-panel]").forEach((button) => {
        const active = button.dataset.panel === moduleId;
        button.classList.toggle("is-active",active);
        if (active) button.setAttribute("aria-current","page"); else button.removeAttribute("aria-current");
      });
      $("#demoRole").value = ui.role;
      if (moduleId === "conflicts") $(".ws-pager").insertAdjacentHTML("beforebegin",requestQueue());
      $("#wsCrumb").textContent = title;
      const setBadge = (id,value,alert) => {
        const badge = $(`[data-badge="${id}"]`);
        if (!badge) return;
        badge.textContent = value ? String(value) : "";
        badge.classList.toggle("alert",Boolean(alert && value));
      };
      setBadge("crises",openCrises().length,openCrises().some((crisis) => crisis.status === "escalating"));
      setBadge("conflicts",pressuredPools().length,true);
      setBadge("collaboration",db.notifications.filter((notice) => !notice.read).length,false);
      setDrawer(false,false);
      if (moduleChanged) panel.scrollTop = 0;
      const crisisStatus = $("#crisisStatus");
      if (moduleId === "crises" && crisisStatus) {
        const crisis = crisisById(ui.selectedCrisis);
        if (crisis) {
          const controls = document.createElement("div");
          controls.className = "detail-controls";
          controls.innerHTML = `<label class="overline" for="crisisSeverity">Severity</label><select id="crisisSeverity" class="work-select" data-crisis-severity="${esc(crisis.id)}"${disabled("crisis")}>${[5,4,3,2,1].map((severity) => `<option value="${severity}"${selectedAttr(severity,crisis.severity)}>${severityNames[severity]}</option>`).join("")}</select><label class="overline" for="crisisCategory">Category</label><select id="crisisCategory" class="work-select" data-crisis-category="${esc(crisis.id)}"${disabled("crisis")}>${["Flood","Fire","Medical","Landslide","Storm","Earthquake","Other"].map((category) => `<option${selectedAttr(category,crisis.category)}>${category}</option>`).join("")}</select>`;
          crisisStatus.closest(".detail-controls").after(controls);
        }
      }
      if (panelOpen && $("#panel").classList.contains("has-workspace")) {
        $$(".panel-view h2").forEach((heading) => heading.removeAttribute("id"));
        const heading = $(".module-head h2");
        heading.id = "panelTitle";
      }
      if (previousId) {
        const replacement = document.getElementById(previousId);
        if (replacement && !replacement.closest("[hidden],[inert]")) {
          replacement.focus({ preventScroll:true });
          if (typeof selectionStart === "number" && typeof replacement.setSelectionRange === "function" && replacement.type === "search") replacement.setSelectionRange(selectionStart,selectionStart);
        }
      }
      syncSidebarPosition();
    }
    const compactNav = matchMedia("(max-width: 900px)");
    function setDrawer(open,focus = true) {
      body.classList.toggle("ws-drawer-open",open);
      const toggle = $("[data-ws-drawer]"), sidebar = $(".workspace-sidebar");
      if (toggle) {
        toggle.setAttribute("aria-expanded",String(open));
        toggle.setAttribute("aria-label",open ? "Close navigation" : "Open navigation");
      }
      if (sidebar) sidebar.inert = compactNav.matches && !open;
      if (open && focus) requestAnimationFrame(() => { const active = $(".workspace-sidebar button.is-active"); if (active) active.focus({ preventScroll:true }); });
    }
    listen(window,"resize",() => setDrawer(body.classList.contains("ws-drawer-open") && compactNav.matches,false),{ passive:true });
    function syncSidebarPosition() {
      if (!panelOpen || !panel.classList.contains("has-workspace") || innerWidth > 768) return;
      const nav = $(".workspace-sidebar nav"), active = $("button.is-active",nav);
      if (active) nav.scrollLeft = Math.max(0,active.offsetLeft - nav.offsetLeft - (nav.clientWidth-active.offsetWidth)/2);
    }

    function assignCapacity(resource,crisis,quantity,reason) {
      if (!resource || !crisis || crisis.status === "resolved" || resource.maintenance || quantity < 1 || quantity > available(resource)) return false;
      const at = new Date().toISOString(), actor = actorNames[ui.role];
      const existing = resource.allocations.find((allocation) => allocation.crisisId === crisis.id);
      if (existing) { existing.quantity += quantity; existing.at = at; existing.actor = actor; }
      else resource.allocations.push({ crisisId:crisis.id,quantity,at,actor });
      const text = `${quantity} ${resource.unit} assigned to ${crisis.title}. ${reason}`;
      resource.history.unshift({ at,actor,text });
      crisis.timeline.unshift({ at,actor,text:`${quantity} ${resource.unit} assigned from ${resource.name}. ${reason}` });
      if (!Number.isFinite(crisis.responseMinutes)) crisis.responseMinutes = Math.max(1,Math.round((Date.now()-new Date(crisis.createdAt).getTime())/60000));
      let filled = quantity;
      db.requests.filter((request) => request.resourceId === resource.id && request.crisisId === crisis.id && request.quantity > 0).forEach((request) => {
        const consumed = Math.min(filled,request.quantity);
        request.quantity -= consumed;
        filled -= consumed;
      });
      return true;
    }
    function releaseCapacity(resource,crisisId) {
      const assignments = resource.allocations.filter((allocation) => allocation.crisisId === crisisId);
      const amount = assignments.reduce((sum,allocation) => sum+allocation.quantity,0);
      if (!amount) return 0;
      resource.allocations = resource.allocations.filter((allocation) => allocation.crisisId !== crisisId);
      const at = new Date().toISOString(), actor = actorNames[ui.role], crisis = crisisById(crisisId);
      resource.history.unshift({ at,actor,text:`Released ${amount} ${resource.unit} from ${crisis?.title || crisisId}.` });
      crisis?.timeline.unshift({ at,actor,text:`Released ${amount} ${resource.unit} to ${resource.name}.` });
      return amount;
    }
    function integer(value,min = 0,max = 1000000) {
      const number = Number(value);
      return Number.isFinite(number) && Number.isInteger(number) && number >= min && number <= max ? number : null;
    }
    function downloadFile(blob,name) {
      const url = URL.createObjectURL(blob), link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url),15000);
    }
    function exportData() {
      const cutoff = Date.now()-ui.analyticsDays*86400000;
      return [
        { name:"Crisis records",headers:["ID","Training incident","City","State","Category","Severity","Status","Response minutes","Latitude","Longitude","Created"],rows:periodCrises().map((crisis) => [crisis.id,crisis.title,crisis.city,crisis.region,crisis.category,severityNames[crisis.severity],crisis.status,crisis.responseMinutes ?? "Not recorded",crisis.lat,crisis.lng,crisis.createdAt]) },
        { name:"Resource inventory",headers:["ID","Resource","Type","Organization","Capacity","Unit","Assigned","Available","Maintenance","Daily unit cost INR"],rows:db.resources.map((resource) => [resource.id,resource.name,resource.type,resource.organization,resource.total,resource.unit,used(resource),available(resource),resource.maintenance ? "Yes" : "No",resource.cost]) },
        { name:"Audit trail",headers:["Time","Actor","Action","Details"],rows:db.audit.filter((entry) => new Date(entry.at).getTime() >= cutoff).map((entry) => [entry.at,entry.actor,entry.action,entry.detail]) },
      ];
    }
    function exportExcel() {
      const cell = (value,header = false) => `<Cell${header ? ' ss:StyleID="Header"' : ""}><Data ss:Type="${typeof value === "number" ? "Number" : "String"}">${esc(value)}</Data></Cell>`;
      const sheets = exportData().map((sheet) => `<Worksheet ss:Name="${esc(sheet.name)}"><Table><Row>${sheet.headers.map((value) => cell(value,true)).join("")}</Row>${sheet.rows.map((row) => `<Row>${row.map((value) => cell(value)).join("")}</Row>`).join("")}</Table></Worksheet>`).join("");
      const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Header"><Font ss:Bold="1"/></Style></Styles>${sheets}</Workbook>`;
      downloadFile(new Blob([xml],{ type:"application/vnd.ms-excel;charset=utf-8" }),"ResQSync-India-demo-report.xml");
      showToast("Excel-compatible workbook download requested. Open the .xml file in Excel. All records are demo data.");
    }
    function exportPdf() {
      const ascii = (value) => String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[–—]/g,"-").replace(/[’‘]/g,"'").replace(/[“”]/g,'"').replace(/[^\x20-\x7e]/g,"");
      const wrap = (value) => {
        const text = ascii(value), lines = [];
        let remaining = text;
        while (remaining.length > 91) {
          const split = remaining.lastIndexOf(" ",91);
          const position = split > 25 ? split : 91;
          lines.push(remaining.slice(0,position));
          remaining = remaining.slice(position).trimStart();
        }
        lines.push(remaining);
        return lines;
      };
      const stats = metrics();
      const lines = ["INDIA OPERATIONS / FICTIONAL DEMONSTRATION",`Prepared ${new Date().toISOString().slice(0,10)} | Last ${ui.analyticsDays} days`,"",
        `Active training incidents: ${stats.active} | Resource pressure: ${stats.conflicts} pools`,
        `Current mean pool utilization: ${stats.utilization}% | Mean sample response: ${stats.response} min`,"",
        "Not a live incident report. No operational or clinical recommendations are implied.","",
      ];
      exportData().forEach((sheet) => {
        lines.push(sheet.name.toUpperCase(),sheet.headers.join(" | "),"");
        sheet.rows.forEach((row) => lines.push(...wrap(row.join(" | "))));
        lines.push("","");
      });
      const flattened = lines.flatMap(wrap), pages = [];
      for (let index = 0; index < flattened.length; index += 43) pages.push(flattened.slice(index,index+43));
      const objects = ["<< /Type /Catalog /Pages 2 0 R >>","","<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>","<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"];
      objects[1] = `<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_,index) => `${5+index*2} 0 R`).join(" ")}] >>`;
      const pdfText = (text) => ascii(text).replace(/([\\()])/g,"\\$1");
      pages.forEach((page,index) => {
        const pageId = 5+index*2, streamId = pageId+1;
        const commands = `BT /F2 22 Tf 40 790 Td (ResQSync) Tj ET\nBT /F1 9 Tf 40 756 Td 15 TL ${page.map((line) => `(${pdfText(line)}) Tj T*`).join("\n")} ET\nBT /F1 8 Tf 40 36 Td (Local demo only / Page ${index+1} of ${pages.length}) Tj ET\n`;
        objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamId} 0 R >>`);
        objects.push(`<< /Length ${commands.length} >>\nstream\n${commands}endstream`);
      });
      let pdf = "%PDF-1.4\n%ResQSync\n";
      const offsets = [0];
      objects.forEach((object,index) => { offsets.push(pdf.length); pdf += `${index+1} 0 obj\n${object}\nendobj\n`; });
      const xref = pdf.length;
      pdf += `xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10,"0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
      downloadFile(new Blob([pdf],{ type:"application/pdf" }),"ResQSync-India-demo-report.pdf");
      showToast("PDF report download requested. It contains fictional and locally created demo records.");
    }

    function handleWorkspaceAction(event) {
      const target = event.target;
      if (target.closest("[data-ws-drawer]")) { setDrawer(!body.classList.contains("ws-drawer-open")); return true; }
      if (target.closest("[data-ws-drawer-close]")) { setDrawer(false); const toggleButton = $("[data-ws-drawer]"); if (toggleButton) toggleButton.focus({ preventScroll:true }); return true; }
      if (target.closest("[data-open-notices]")) { ui.communicationTab = "notifications"; openPanel("collaboration"); return true; }
      const quick = target.closest("[data-quick]");
      if (quick) {
        const routes = { crisis:["crises","newCrisis"],assign:["resources","assignResource"],request:["conflicts","newRequest"],message:["collaboration",null],report:["analytics",null] };
        const [moduleId,formId] = routes[quick.dataset.quick] || ["overview",null];
        if (moduleId === "collaboration") ui.communicationTab = "messages";
        openPanel(moduleId);
        requestAnimationFrame(() => {
          const form = formId && document.getElementById(formId);
          if (form) { form.hidden = false; const field = form.querySelector("input,select,textarea"); if (field) field.focus({ preventScroll:true }); form.scrollIntoView({ block:"nearest" }); }
          else if (moduleId === "collaboration") { const area = $("#workspaceContent textarea[name='text']"); if (area) area.focus({ preventScroll:true }); }
        });
        return true;
      }
      const toggle = target.closest("[data-toggle-form]");
      if (toggle) {
        const form = document.getElementById(toggle.dataset.toggleForm);
        if (form) { form.hidden = !form.hidden; if (!form.hidden) $("input,select,textarea",form)?.focus({ preventScroll:true }); }
        return true;
      }
      const detail = target.closest("[data-crisis-detail]");
      if (detail) { ui.selectedCrisis = detail.dataset.crisisDetail; renderWorkspace("crises"); return true; }
      if (target.closest("[data-hide-crisis]")) { ui.selectedCrisis = null; renderWorkspace("crises"); return true; }
      const crisisTab = target.closest("[data-crisis-tab]");
      if (crisisTab) { ui.crisisTab = crisisTab.dataset.crisisTab; renderWorkspace("crises"); return true; }
      const resourceDetailButton = target.closest("[data-resource-detail]");
      if (resourceDetailButton) { ui.selectedResource = resourceDetailButton.dataset.resourceDetail; renderWorkspace("resources"); return true; }
      if (target.closest("[data-hide-resource]")) { ui.selectedResource = null; renderWorkspace("resources"); return true; }
      const discuss = target.closest("[data-discuss]");
      if (discuss) { ui.channel = discuss.dataset.discuss; ui.communicationTab = "messages"; openPanel("collaboration"); return true; }
      const maintenance = target.closest("[data-maintenance]");
      if (maintenance) {
        if (!requireRole("resource")) return true;
        const resource = resourceById(maintenance.dataset.maintenance);
        if (!resource) return true;
        if (!resource.maintenance && used(resource) > 0) { showToast("Release current assignments before putting this pool into maintenance."); return true; }
        resource.maintenance = !resource.maintenance;
        const text = resource.maintenance ? "Pool placed in maintenance; capacity unavailable." : "Maintenance cleared; pool returned to available inventory.";
        resource.maintenanceLog.unshift({ at:new Date().toISOString(),actor:actorNames[ui.role],text });
        resource.history.unshift({ at:new Date().toISOString(),actor:actorNames[ui.role],text });
        record("Maintenance status changed",`${resource.name}: ${text}`);
        notify(`${resource.name}: ${text}`);
        finishChange(text);
        return true;
      }
      const release = target.closest("[data-release]");
      if (release) {
        if (!requireRole("allocate")) return true;
        const resource = resourceById(release.dataset.release);
        if (!resource) return true;
        const amount = releaseCapacity(resource,release.dataset.releaseCrisis);
        record("Assignment released",`${amount} ${resource.unit} returned to ${resource.name}.`);
        notify(`${resource.name}: ${amount} ${resource.unit} returned to the available pool.`);
        finishChange("Assignment released. Inventory and the crisis timeline have been updated.");
        return true;
      }
      const approve = target.closest("[data-approve-pool]");
      if (approve) {
        if (!requireRole("approve")) return true;
        const resource = resourceById(approve.dataset.approvePool);
        if (!resource) return true;
        const plan = recommendation(resource).filter((request) => request.allocation > 0);
        if (!plan.length) { showToast("No available capacity. Arrange backfill or release existing assignments first."); return true; }
        const summary = [];
        plan.forEach((request) => {
          if (assignCapacity(resource,request.crisis,request.allocation,`Priority score ${request.score}; recommendation approved.`)) summary.push(`${request.crisis.city}: ${request.allocation} ${resource.unit}`);
        });
        const text = `${resource.name} / ${summary.join("; ")}. Unmet requests remain visible.`;
        db.decisions.unshift({ id:uid("D"),at:new Date().toISOString(),actor:actorNames[ui.role],type:"Recommendation approved",text });
        record("Resource recommendation approved",text);
        notify(`Commander approval recorded locally: ${text}`);
        finishChange("Recommendation approved in the demo. No units or external stakeholders were notified.");
        return true;
      }
      if (target.closest("[data-recalculate]")) { renderWorkspace("conflicts"); showToast("Recommendations recalculated from current availability and open requests."); return true; }
      const negotiation = target.closest("[data-agree-negotiation]");
      if (negotiation) {
        if (!requireRole("approve")) return true;
        const entry = db.negotiations.find((item) => item.id === negotiation.dataset.agreeNegotiation);
        if (entry) {
          entry.status = "resolved";
          entry.agreedBy = actorNames[ui.role];
          record("Compromise agreement recorded",entry.proposal);
          notify(`Local agreement: ${entry.proposal}. Resource assignment is still a separate action.`);
          finishChange("Agreement recorded. This does not automatically move any resource.");
        }
        return true;
      }
      const communicationTab = target.closest("[data-communication-tab]");
      if (communicationTab) { ui.communicationTab = communicationTab.dataset.communicationTab; renderWorkspace("collaboration"); return true; }
      if (target.closest("[data-mark-notifications]")) { db.notifications.forEach((notice) => notice.read = true); saveDb(); renderWorkspace("collaboration"); showToast("Local notification records marked as read."); return true; }
      const attachment = target.closest("[data-download-attachment]");
      if (attachment) {
        const file = attachmentsInSession.get(attachment.dataset.downloadAttachment);
        if (file) downloadFile(file,file.name); else showToast("That file is not available in this session. Reattach it to download.");
        return true;
      }
      const exportButton = target.closest("[data-export]");
      if (exportButton) { if (exportButton.dataset.export === "pdf") exportPdf(); else exportExcel(); return true; }
      if (target.closest("[data-save-simulation]")) {
        if (!requireRole("save") || !ui.simulation) return true;
        const simulation = { ...ui.simulation,id:uid("S"),at:new Date().toISOString(),actor:actorNames[ui.role] };
        db.simulations.unshift(simulation);
        db.simulations = db.simulations.slice(0,20);
        record("Scenario saved",`${simulation.resourceName}: ${simulation.covered} of ${simulation.demand} requested units proposed.`);
        finishChange("Simulation saved with its assumptions. Inventory was not changed.");
        return true;
      }
      if (target.closest("[data-simulation-conflict]")) { if (ui.simulation) ui.conflictResource = ui.simulation.resourceId; openPanel("conflicts"); return true; }
      const reset = target.closest("[data-reset-demo]");
      if (reset) {
        if (!requireRole("users")) return true;
        if (reset.dataset.confirmed !== "yes") {
          reset.dataset.confirmed = "yes";
          reset.textContent = "Click again to reset all demo changes";
          setTimeout(() => { if (reset.isConnected) { reset.dataset.confirmed = ""; reset.textContent = "Reset demo data"; } },6000);
        } else {
          db = seedWorkspace();
          ui.selectedCrisis = "C-MUM"; ui.selectedResource = null; ui.simulation = null;
          attachmentsInSession.clear();
          saveDb(); renderWorkspace(ui.module); reset.dataset.confirmed = ""; reset.textContent = "Reset demo data";
          showToast("The original fictional India dataset has been restored.");
        }
        return true;
      }
      if (target.closest("[data-home]")) { event.preventDefault(); closePanel(); return true; }
      return false;
    }

    listen(document,"input",(event) => {
      const target = event.target;
      if (target.id === "crisisSearch") { ui.crisisQuery = target.value; if ($("#crisisRows")) $("#crisisRows").innerHTML = crisisRows(); else renderWorkspace("crises"); }
      if (target.id === "resourceSearch") { ui.resourceQuery = target.value; $("#resourceRows").innerHTML = resourceRows(); }
      if (target.id === "severityWeight") $("#severityWeightLabel").textContent = `${target.value}%`;
    });
    listen(document,"change",(event) => {
      const target = event.target;
      if (target.id === "demoRole") { if (roleNames[target.value]) { ui.role = target.value; renderWorkspace(ui.module); showToast(`${roleNames[ui.role]} permissions preview. This is not authentication.`); } return; }
      if (target.id === "crisisFilter") { ui.crisisFilter = target.value; renderWorkspace("crises"); return; }
      if (target.id === "resourceFilter") { ui.resourceFilter = target.value; renderWorkspace("resources"); return; }
      if (target.id === "messageChannel") { ui.channel = target.value; renderWorkspace("collaboration"); return; }
      if (target.id === "analyticsRange") { ui.analyticsDays = Number(target.value) === 7 ? 7 : 30; renderWorkspace("analytics"); return; }
      if (target.id === "simulationPool") {
        const resource = resourceById(target.value);
        if (resource) { $("#simulationCapacity").value = available(resource); $("#simulationCost").value = resource.cost; }
        return;
      }
      if (target.dataset.crisisStatus) {
        if (!requireRole("crisis")) return;
        const crisis = crisisById(target.dataset.crisisStatus);
        if (!crisis || !["active","escalating","resolved"].includes(target.value) || target.value === crisis.status) return;
        crisis.status = target.value;
        crisis.timeline.unshift({ at:new Date().toISOString(),actor:actorNames[ui.role],text:`Status changed to ${crisis.status}.` });
        if (crisis.status === "resolved") db.resources.forEach((resource) => releaseCapacity(resource,crisis.id));
        record("Crisis status updated",`${crisis.title}: ${crisis.status}.`);
        notify(`${crisis.title} is now ${crisis.status}.`);
        finishChange("Status and timeline updated. Resolving an incident releases its assignments.");
        return;
      }
      if (target.dataset.crisisSeverity || target.dataset.crisisCategory) {
        if (!requireRole("crisis")) return;
        const crisis = crisisById(target.dataset.crisisSeverity || target.dataset.crisisCategory);
        if (!crisis) return;
        let detail;
        if (target.dataset.crisisSeverity) {
          const severity = integer(target.value,1,5);
          if (severity === null) return;
          crisis.severity = severity;
          detail = `Severity changed to ${severityNames[severity]}.`;
        } else {
          if (!["Flood","Fire","Medical","Landslide","Storm","Earthquake","Other"].includes(target.value)) return;
          crisis.category = target.value;
          detail = `Category changed to ${crisis.category}.`;
        }
        crisis.timeline.unshift({ at:new Date().toISOString(),actor:actorNames[ui.role],text:detail });
        record("Crisis classification updated",`${crisis.title}: ${detail}`);
        notify(`${crisis.title}: ${detail}`);
        finishChange("Incident classification updated. Priority recommendations use the latest severity.");
        return;
      }
      if (target.dataset.userRole) {
        if (!requireRole("users") || !roleNames[target.value]) return;
        const user = db.users.find((item) => item.id === target.dataset.userRole);
        if (!user) return;
        user.role = target.value;
        record("Demo user role changed",`${user.name}: ${roleNames[user.role]}.`);
        finishChange("Demo profile updated. Server authorization remains unconnected.");
        return;
      }
      if (target.dataset.notificationPref) {
        if (!requireRole("save")) return;
        const key = target.dataset.notificationPref;
        if (["email","sms","push"].includes(key)) {
          db.preferences[key] = target.checked;
          record("Notification preference updated",`${key}: ${target.checked ? "enabled" : "disabled"} in the local configuration preview.`);
          saveDb(); showToast("Preference recorded locally. No delivery provider is connected.");
        }
      }
    });
    listen(document,"submit",(event) => {
      const form = event.target;
      if (!form.dataset.workForm) return;
      event.preventDefault();
      if (!form.reportValidity()) return;
      const values = new FormData(form), get = (key) => String(values.get(key) || "").trim();
      const type = form.dataset.workForm;
      if (type === "crisis") {
        if (!requireRole("crisis")) return;
        const severity = integer(get("severity"),1,5), population = integer(get("population"));
        const lat = Number(get("lat")), lng = Number(get("lng"));
        if (!get("title") || !get("city") || !get("region") || severity === null || population === null || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < 6 || lat > 37 || lng < 67 || lng > 98) { showToast("Provide a name, location, valid severity, and coordinates inside the demo footprint."); return; }
        const at = new Date().toISOString(), crisis = { id:uid("C"),title:get("title").slice(0,90),city:get("city").slice(0,60),region:get("region").slice(0,60),lat,lng,category:get("category"),severity,status:get("status") === "escalating" ? "escalating" : "active",population,responseMinutes:null,createdAt:at,timeline:[{ at,actor:actorNames[ui.role],text:"Training incident created locally." }] };
        db.crises.unshift(crisis); ui.selectedCrisis = crisis.id;
        record("Training crisis created",`${crisis.title} / ${crisis.city}.`);
        notify(`New training incident: ${crisis.title}.`);
        finishChange("Training crisis created. It is not a live emergency alert.");
      } else if (type === "resource") {
        if (!requireRole("resource")) return;
        const total = integer(get("total"),1), cost = integer(get("cost"),0,10000000);
        if (total === null || cost === null || !get("name") || !get("unit") || !get("organization") || !get("capability") || !["Personnel","Equipment","Supplies","Facilities"].includes(get("type"))) { showToast("Check the capacity, cost, type, organization, and capability fields."); return; }
        const at = new Date().toISOString();
        const resource = { id:uid("R"),name:get("name").slice(0,80),type:get("type"),total,unit:get("unit").slice(0,30),cost,organization:get("organization").slice(0,70),capability:get("capability").slice(0,350),maintenance:false,allocations:[],history:[{ at,actor:actorNames[ui.role],text:"Inventory pool created locally." }],maintenanceLog:[] };
        db.resources.push(resource); ui.selectedResource = resource.id;
        record("Resource inventory created",`${resource.name}: ${total} ${resource.unit}.`);
        finishChange("Resource pool added to the local inventory.");
      } else if (type === "assign" || type === "override") {
        if (!requireRole(type === "override" ? "approve" : "allocate")) return;
        const resource = resourceById(get("resourceId")), crisis = crisisById(get("crisisId")), quantity = integer(get("quantity"),1), reason = get("reason").slice(0,250);
        const contested = resource && resourceRequests(resource.id).reduce((sum,request) => sum+request.quantity,0) > available(resource);
        if (contested && !has("approve")) { showToast("This pool has competing or uncovered demand. A manager or admin must approve the allocation in Conflict Resolution."); return; }
        if (!resource || !crisis || quantity === null || !reason || !assignCapacity(resource,crisis,quantity,reason)) { showToast("Assignment not made. Check available capacity, the active crisis, quantity, and rationale."); return; }
        const text = `${resource.name}: ${quantity} ${resource.unit} to ${crisis.city}. ${reason}`;
        if (type === "override" || contested) db.decisions.unshift({ id:uid("D"),at:new Date().toISOString(),actor:actorNames[ui.role],type:type === "override" ? "Manual override" : "Manual allocation under demand pressure",text });
        record(type === "override" || contested ? "Manual allocation approved" : "Resource assigned",text);
        notify(`Local assignment: ${text}`);
        finishChange("Assignment recorded. Availability, requests, and the crisis timeline have been updated.");
      } else if (type === "request") {
        if (!requireRole("allocate")) return;
        const resource = resourceById(get("resourceId")), crisis = crisisById(get("crisisId")), quantity = integer(get("quantity"),1);
        if (!resource || !crisis || crisis.status === "resolved" || quantity === null) { showToast("Choose a valid resource and active crisis, and enter a positive quantity."); return; }
        const existing = db.requests.find((request) => request.resourceId === resource.id && request.crisisId === crisis.id);
        if (existing && existing.quantity+quantity > 1000000) { showToast("Requested quantity exceeds the demo limit."); return; }
        if (existing) existing.quantity += quantity;
        else db.requests.push({ id:uid("Q"),resourceId:resource.id,crisisId:crisis.id,quantity });
        record("Resource request added",`${crisis.title}: ${quantity} ${resource.unit} / ${resource.name}. ${get("reason")}`);
        notify(`New competing request: ${resource.name} / ${crisis.city}.`);
        finishChange("Request recorded. Resource pressure and recommendations have been recalculated.");
      } else if (type === "negotiation") {
        if (!requireRole("allocate")) return;
        const resource = resourceById(get("resourceId"));
        if (!resource || get("proposal").length < 5) return;
        db.negotiations.unshift({ id:uid("G"),resourceId:resource.id,proposal:get("proposal").slice(0,350),at:new Date().toISOString(),actor:actorNames[ui.role],status:"pending" });
        record("Negotiation proposal recorded",`${resource.name}: ${get("proposal")}`);
        notify(`Local compromise proposal recorded for ${resource.name}.`);
        finishChange("Proposal recorded for a manager or admin to review. No resources moved.");
      } else if (type === "user") {
        if (!requireRole("users") || !roleNames[get("role")]) return;
        if (!get("name") || !get("organization")) { showToast("Provide a demo name and organization."); return; }
        if (db.users.some((user) => user.email.toLowerCase() === get("email").toLowerCase())) { showToast("A demo profile already exists with that email."); return; }
        db.users.push({ id:uid("U"),name:get("name").slice(0,65),email:get("email").slice(0,120),organization:get("organization").slice(0,75),role:get("role"),status:"Local invite / unsent" });
        record("Local invitation prepared",`${get("name")} / ${get("organization")} / ${roleNames[get("role")]}. No email sent.`);
        finishChange("Local invitation record prepared. No authentication account or email was created.");
      } else if (type === "message") {
        if (!requireRole("message") || get("text").length < 2) return;
        const at = new Date().toISOString(), text = get("text").slice(0,1200);
        db.messages.push({ id:uid("M"),channel:ui.channel,author:actorNames[ui.role],text,at });
        crisisById(ui.channel)?.timeline.unshift({ at,actor:actorNames[ui.role],text:"A local comment was added to the incident thread." });
        record("Local message posted",`${ui.channel}: ${text.slice(0,100)}`);
        notify(`New local comment in ${ui.channel === "network" ? "network coordination" : ui.channel === "decisions" ? "decision discussion" : crisisById(ui.channel)?.title || "the thread"}.`);
        finishChange("Message added locally. No network stakeholders were contacted.");
      } else if (type === "attachment") {
        if (!requireRole("message")) return;
        const file = values.get("file");
        if (!(file instanceof File) || !file.size || file.size > 5*1024*1024 || !["pdf","csv","txt","json","png","jpg","jpeg"].includes(file.name.toLowerCase().split(".").pop())) { showToast("Choose a supported, non-empty document up to 5 MB."); return; }
        const id = uid("F"), at = new Date().toISOString();
        attachmentsInSession.set(id,file);
        db.attachments.push({ id,name:file.name,size:file.size,type:file.type,at,author:actorNames[ui.role],channel:ui.channel });
        record("Session document attached",`${file.name} / ${ui.channel}. File content stays in this session.`);
        finishChange("Document attached to the local thread. Nothing was uploaded.");
      } else if (type === "simulation") {
        const resource = resourceById(get("resourceId")), capacity = integer(get("capacity")), cost = integer(get("cost"),0,10000000), weight = integer(get("weight"),20,90);
        if (!resource || capacity === null || cost === null || weight === null) { showToast("Check the scenario pool, capacity, cost, and priority weighting."); return; }
        const plan = recommendation(resource,capacity,weight);
        ui.simulation = { resourceId:resource.id,resourceName:resource.name,capacity,cost,weight,demand:plan.reduce((sum,item) => sum+item.quantity,0),covered:plan.reduce((sum,item) => sum+item.allocation,0),rows:plan.map((item) => ({ title:item.crisis.title,city:item.crisis.city,quantity:item.quantity,allocation:item.allocation,score:item.score })) };
        $("#simulationResult").innerHTML = simulationResult(ui.simulation);
        showToast("Scenario calculated. No inventory or requests were changed.");
      }
    });
    listen(window,"storage",(event) => {
      if (event.key === appearanceKey) {
        if (event.newValue === "light" || event.newValue === "dark") setTheme(event.newValue,false);
        return;
      }
      if (event.key !== storageKey || !event.newValue) return;
      try {
        const incoming = JSON.parse(event.newValue);
        if (validWorkspace(incoming)) {
          db = incoming;
          if (panelOpen && panel.classList.contains("has-workspace")) { renderWorkspace(ui.module); showToast("Local demo updated from another same-browser tab."); }
        }
      } catch { /* A malformed external storage update is ignored. */ }
    });

    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const vectors = cards.map((element, index) => {
      const y = 1 - (index / (cards.length - 1)) * 2;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = index * Math.PI * (3 - Math.sqrt(5));
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      return { element,x,y,z,lat:Math.asin(y) / radians,lon:Math.atan2(x,z) / radians,dim:-1,opacity:-1 };
    });

    function layout(force = false) {
      const width = innerWidth, height = innerHeight;
      if (!force && Math.abs(width - lastWidth) < 20 && Math.abs(height - lastHeight) < 20) return;
      lastWidth = width;
      lastHeight = height;
      const small = width <= 380, mobile = width <= 640;
      const hr = small ? .38 : mobile ? .42 : .46;
      const wr = small ? .48 : mobile ? .52 : .58;
      const floor = small ? 108 : mobile ? 120 : 155;
      R = Math.max(floor, Math.min(480, height * hr, width * wr));
      const scale = small ? .44 : mobile ? .46 : .47;
      html.style.setProperty("--cw", `${Math.round(Math.max(72, R * scale))}px`);
      perspective = small ? 620 : mobile ? 760 : width <= 900 ? 920 : 1150;
      html.style.setProperty("--persp", `${perspective}px`);
      lastPlacedR = -1;
    }

    function syncIsolation() {
      const modal = introActive || menuOpen || litOpen || panelOpen;
      $("#experience").inert = introActive;
      intro.inert = !introActive;
      intro.setAttribute("aria-hidden",String(!introActive));
      $("#skipPlatform").inert = !revealed || modal;
      stage.inert = !revealed || gridOpen || modal;
      grid.inert = !gridOpen || modal;
      grid.setAttribute("aria-hidden", String(!gridOpen || modal));
      $(".bio").inert = !revealed || deep || gridOpen || modal;
      $(".colophon").inert = !revealed || gridOpen || modal;
      gridBtn.inert = !revealed || modal || (!deep && !gridOpen);
      $("#motionToggle").inert = !revealed || modal || gridOpen;
      $("header").inert = litOpen || panelOpen;
      $(".cue").inert = !revealed || modal || deep || gridOpen;
      const loginEl=$("#login"); if(loginEl){ loginEl.inert = !loginEl.classList.contains("is-open"); }
      menu.inert = !menuOpen;
      menu.setAttribute("aria-hidden", String(!menuOpen));
      lit.inert = !litOpen;
      lit.setAttribute("aria-hidden", String(!litOpen));
      panel.inert = !panelOpen;
      panel.setAttribute("aria-hidden", String(!panelOpen));
    }

    function syncLock(forceUnlock = false) {
      const next = !forceUnlock && (introActive || !revealed || menuOpen || gridOpen || litOpen || panelOpen);
      if (next && !locked) parkedScroll = window.scrollY;
      html.style.overflow = next ? "hidden" : "";
      body.style.overflow = next ? "hidden" : "";
      if (!next && locked) window.scrollTo(0, clamp(parkedScroll, 0, innerHeight * .16));
      locked = next;
    }

    function renderFrame(now = performance.now()) {
      const elapsed = clamp(now-lastFrame,0,48);
      lastFrame = now;
      if (introActive) introProgress.style.transform = `scaleX(${clamp((now-introStartedAt)/introDuration,0,1)})`;
      if (revealed && state.autoRotate && !reduced.matches && !state.dragging && !pointer && !introActive && !litOpen && !menuOpen && !panelOpen && !gridOpen && !document.hidden && now > spinResumeAt) state.spin = (state.spin + elapsed * .0055) % 360;
      if (!state.dragging && !introActive && !litOpen && !menuOpen && !panelOpen) {
        state.dragX += state.velX;
        state.dragY += state.velY;
        state.velX *= .94;
        state.velY *= .94;
        if (Math.abs(state.velX) < .002) state.velX = 0;
        if (Math.abs(state.velY) < .002) state.velY = 0;
      }
      const pitch = clamp(state.tilt + state.dragY, -32, 32);
      if (pitch !== state.tilt + state.dragY) state.velY = 0;
      state.dragY = pitch - state.tilt;
      const p = clamp(window.scrollY / (innerHeight * .16), 0, 1);
      const targetZ = p * Math.min(64, R * .12);
      state.camZ += (targetZ - state.camZ) * .075;
      const sx = state.tilt + state.dragY, sy = state.spin + state.dragX;
      world.style.transform = `translateZ(${state.camZ}px) rotateY(${sy}deg) rotateX(${sx}deg)`;
      // The photographs gather into a tight ball, then drift out and keep breathing.
      if (!sphereBorn && !introActive) sphereBorn = now;
      let grown = 1, breathScale = 1;
      if (!reduced.matches) {
        grown = sphereBorn ? clamp((now - sphereBorn) / 3600, 0, 1) : 0;
        const eased = 1 - Math.pow(1 - grown, 3);
        const age = now - sphereBorn;
        const pulse = state.autoRotate && age > 3600 ? Math.cos((age - 3600) * Math.PI * 2 / 14000) * .11 * eased : 0;
        breathScale = .16 + .84 * eased + pulse;
      }
      const effR = R * breathScale;
      stageGlow.style.setProperty("--orbit-size",`${Math.max(72,effR * 2)}px`);
      const writeCards = !reduced.matches || Math.abs(effR - lastPlacedR) > .05;
      const bobAmp = reduced.matches || !state.autoRotate ? 0 : 4.5 * grown;
      if (writeCards) lastPlacedR = effR;
      // Counter-rotation cancels the world rotation; only .inner centers the title.
      headline.style.transform = `rotateX(${-sx}deg) rotateY(${-sy}deg) translateZ(${R * .62}px)`;
      headline.style.opacity = String(Math.max(0, 1 - p * (currentTheme === "light" ? .35 : .55)));
      const sinX = Math.sin(sx * radians), cosX = Math.cos(sx * radians);
      const sinY = Math.sin(sy * radians), cosY = Math.cos(sy * radians);
      const shade = 1 - Math.min(1, p * 1.6);
      const near = perspective * .66;
      vectors.forEach((v, index) => {
        if (writeCards) {
          const bob = bobAmp ? Math.sin(now * .0007 + index * 1.7) * bobAmp : 0;
          v.element.style.transform = `translate3d(${v.x * effR}px,${-v.y * effR + bob}px,${v.z * effR}px) rotateY(${v.lon}deg) rotateX(${v.lat}deg)`;
        }
        const zAfterPitch = -v.y * sinX + v.z * cosX;
        const zf = clamp(-v.x * sinY + zAfterPitch * cosY,-1,1);
        const base = .14 + .86 * Math.pow((zf + 1) / 2, .85);
        let dim = shade * (1 - base);
        const absZ = zf * effR + state.camZ;
        let fade = absZ > near ? Math.max(0, 1 - (absZ - near) / 190) : 1;
        if (litOpen) {
          dim = Math.min(1, dim + .78);
          if (focused === index) fade = 0;
        }
        if (currentTheme === "light") dim *= .42;
        if (Math.abs(dim - v.dim) > .001) {
          v.element.style.setProperty("--d", dim.toFixed(4));
          v.dim = dim;
        }
        if (Math.abs(fade - v.opacity) > .001) {
          v.element.style.opacity = fade.toFixed(4);
          v.opacity = fade;
        }
      });
      const nextDeep = p > .15;
      if (nextDeep !== deep) {
        deep = nextDeep;
        body.classList.toggle("deep", deep);
        syncIsolation();
      }
      if (fine.matches && cursor.seen) {
        cursor.x += (cursor.tx - cursor.x) * .2;
        cursor.y += (cursor.ty - cursor.y) * .2;
        dot.style.transform = `translate3d(${cursor.x}px,${cursor.y}px,0)`;
      }
    }

    layout(true);
    renderFrame();
    function animate(now) { renderFrame(now); requestAnimationFrame(animate); }
    requestAnimationFrame(animate);
    function syncMotionButton() {
      const button = $("#motionToggle"), paused = !state.autoRotate || reduced.matches;
      button.setAttribute("aria-pressed",String(paused));
      button.setAttribute("aria-label",reduced.matches ? "Sphere rotation paused for reduced motion" : paused ? "Resume sphere rotation" : "Pause sphere rotation");
      button.title = reduced.matches ? "Reduced motion is enabled" : paused ? "Resume rotation" : "Pause rotation";
      button.disabled = reduced.matches;
      button.innerHTML = paused ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3l8 5-8 5V3Z" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>' : '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3v10M11 3v10" stroke="currentColor" stroke-width="1.5"/></svg>';
    }
    listen($("#motionToggle"),"click",() => { state.autoRotate = !state.autoRotate; spinResumeAt = 0; syncMotionButton(); });
    const onMotionPreference = () => { if (reduced.matches) { state.autoRotate = false; state.velX = state.velY = 0; } syncMotionButton(); };
    if (typeof reduced.addEventListener === "function") listen(reduced,"change",onMotionPreference);
    else if (typeof reduced.addListener === "function") reduced.addListener(onMotionPreference);
    syncMotionButton();

    listen(window,"resize", () => layout(false), { passive:true });
    listen(window,"orientationchange", () => setTimeout(() => layout(true), 220));
    if (window.visualViewport) {
      listen(visualViewport,"resize", () => layout(true), { passive:true });
      listen(visualViewport,"scroll", () => layout(true), { passive:true });
    }
    listen(window,"scroll", () => {
      const max = innerHeight * .16;
      if (!locked && window.scrollY > max + 1) window.scrollTo(0, max);
    }, { passive:true });

    function cancelPointer() {
      state.dragging = false;
      body.classList.remove("dragging");
      if (pointer && stage.hasPointerCapture(pointer.id)) stage.releasePointerCapture(pointer.id);
      pointer = null;
    }

    listen(stage,"pointerdown", (event) => {
      if (litOpen || menuOpen || panelOpen || gridOpen || !revealed || !event.isPrimary || event.button > 0) return;
      const card = event.target.closest(".card");
      spinResumeAt = performance.now()+1500;
      pointer = { id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,card,pending:event.pointerType === "touch",touch:event.pointerType === "touch",distance:0,time:performance.now() };
      state.velX = state.velY = 0;
      if (!pointer.pending) {
        state.dragging = true;
        stage.setPointerCapture(event.pointerId);
        body.classList.add("dragging");
        event.preventDefault();
      }
    });
    listen(stage,"pointermove", (event) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const totalX = event.clientX - pointer.x, totalY = event.clientY - pointer.y;
      pointer.distance = Math.max(pointer.distance, Math.hypot(totalX, totalY));
      if (pointer.pending) {
        if (Math.max(Math.abs(totalX), Math.abs(totalY)) < 10) return;
        if (Math.abs(totalY) > Math.abs(totalX) * 1.15) {
          cancelPointer();
          return;
        }
        pointer.pending = false;
        state.dragging = true;
        stage.setPointerCapture(event.pointerId);
        body.classList.add("dragging");
      }
      const dx = event.clientX - pointer.lastX, dy = event.clientY - pointer.lastY;
      state.dragX += dx * .13;
      state.dragY += dy * .13;
      state.dragY = clamp(state.dragY, -32 - state.tilt, 32 - state.tilt);
      state.velX = dx * .13;
      state.velY = dy * .13;
      pointer.lastX = event.clientX;
      pointer.lastY = event.clientY;
      pointer.time = performance.now();
      if (event.cancelable) event.preventDefault();
    }, { passive:false });
    listen(stage,"pointerup", (event) => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const down = pointer;
      spinResumeAt = performance.now()+1800;
      const slop = coarse.matches || down.touch ? 14 : 6;
      const click = down.distance <= slop && down.card;
      if (performance.now() - down.time > 120 || reduced.matches || click) state.velX = state.velY = 0;
      cancelPointer();
      if (click) openShot(Number(down.card.dataset.idx), down.card);
    });
    listen(stage,"pointercancel", () => { state.velX = state.velY = 0; cancelPointer(); });

    function setGrid(open, restoreFocus = true) {
      if (litOpen) closeShot(false);
      if (menuOpen) setMenu(false, false);
      gridOpen = open;
      body.classList.toggle("gridview", open);
      gridBtn.setAttribute("aria-pressed", String(open));
      syncLock();
      syncIsolation();
      if (restoreFocus) requestAnimationFrame(() => {
        if (open) gridFigures[0].focus({ preventScroll:true });
        else if (deep) gridBtn.focus({ preventScroll:true });
        else menuBtn.focus({ preventScroll:true });
      });
    }

    function setMenu(open, restoreFocus = true) {
      if (open && introActive) finishIntro({ restoreFocus:false });
      cancelPointer();
      state.velX = state.velY = 0;
      menuOpen = open;
      body.classList.toggle("menu-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      syncLock();
      syncIsolation();
      if (restoreFocus) requestAnimationFrame(() => {
        if (open) $("nav a", menu).focus();
        else menuBtn.focus({ preventScroll:true });
      });
    }

    function populateShot(index) {
      const shot = shots[index], token = ++mediaToken;
      $("#litImage").src = thumbs[index] || shot.image;
      $("#litImage").alt = shot.alt;
      $("#litTitle").textContent = shot.title;
      $("#litWhere").textContent = shot.place;
      $("#litNote").textContent = shot.note;
      $("#litCredit").textContent = shot.generated ? "AI-generated India response illustration ↗" : `Photography: ${shot.credit} / Pexels ↗`;
      $("#litCredit").href = shot.source;
      $("#litCount").textContent = `${String(index + 1).padStart(2,"0")} / ${shots.length}`;
      const full = new Image();
      full.onload = () => {
        if (litOpen && token === mediaToken) $("#litImage").src = shot.image;
      };
      full.src = shot.image;
    }

    function openShot(index, source) {
      if (!revealed || panelOpen) return;
      clearTimeout(closeTimer);
      cancelAnimationFrame(lightboxFrame);
      const sourceRect = source.getBoundingClientRect();
      sourceNode = source;
      lightboxReturn = source;
      currentShot = index;
      focused = index;
      cancelPointer();
      state.velX = state.velY = 0;
      populateShot(index);
      litOpen = true;
      body.classList.add("lit");
      syncLock();
      syncIsolation();
      lit.scrollTop = 0;
      plate.style.transition = "none";
      plate.style.transform = "none";
      plate.style.opacity = "1";
      const target = plate.getBoundingClientRect();
      const dx = sourceRect.left + sourceRect.width / 2 - target.left - target.width / 2;
      const dy = sourceRect.top + sourceRect.height / 2 - target.top - target.height / 2;
      const scale = Math.max(.04, sourceRect.width / Math.max(1,target.width));
      plate.style.transform = `translate(${dx}px,${dy}px) scale(${scale})`;
      plate.style.opacity = "0";
      void plate.offsetWidth;
      lightboxFrame = requestAnimationFrame(() => {
        if (!litOpen) return;
        plate.style.transition = "";
        plate.style.transform = "";
        plate.style.opacity = "";
        $(".shot [data-close]").focus({ preventScroll:true });
      });
    }

    function navigateShot(direction) {
      if (!litOpen) return;
      currentShot = (currentShot + direction + shots.length) % shots.length;
      focused = currentShot;
      sourceNode = gridOpen ? gridFigures[currentShot] : cards[currentShot];
      lightboxReturn = sourceNode;
      populateShot(currentShot);
    }

    function closeShot(restoreFocus = true) {
      if (!litOpen) return;
      cancelAnimationFrame(lightboxFrame);
      focused = -1;
      mediaToken++;
      const returnNode = lightboxReturn;
      const token = mediaToken;
      const target = sourceNode && sourceNode.getBoundingClientRect();
      const current = plate.getBoundingClientRect();
      if (target) {
        const dx = target.left + target.width / 2 - current.left - current.width / 2;
        const dy = target.top + target.height / 2 - current.top - current.height / 2;
        plate.style.transform = `translate(${dx}px,${dy}px) scale(${Math.max(.04,target.width / Math.max(1,current.width))})`;
      }
      plate.style.opacity = "0";
      litOpen = false;
      body.classList.remove("lit");
      syncLock();
      syncIsolation();
      closeTimer = setTimeout(() => {
        if (litOpen || token !== mediaToken) return;
        plate.style.transition = "none";
        plate.style.transform = "";
        plate.style.opacity = "";
        requestAnimationFrame(() => { if (!litOpen) plate.style.transition = ""; });
        if (restoreFocus && !panelOpen && !menuOpen) {
          if (returnNode && !returnNode.closest("[inert]")) returnNode.focus({ preventScroll:true });
          else menuBtn.focus({ preventScroll:true });
        }
      }, reduced.matches ? 160 : 640);
    }

    function openPanel(view) {
      if (introActive) finishIntro({ restoreFocus:false });
      const workspace = moduleIds.includes(view);
      if (workspace) renderWorkspace(view);
      const selected = $(`[data-view="${workspace ? "platform" : view}"]`, panel);
      if (!selected) return;
      const switching = panelOpen;
      if (!panelOpen) panelReturn = menuOpen ? menuBtn : document.activeElement;
      if (menuOpen) setMenu(false, false);
      if (litOpen) closeShot(false);
      $$(".panel-view",panel).forEach((node) => {
        node.hidden = node !== selected;
        $$("h2",node).forEach((heading) => heading.removeAttribute("id"));
      });
      $("h2",selected).id = "panelTitle";
      panel.classList.toggle("has-workspace",workspace);
      panelOpen = true;
      body.classList.add("panelopen");
      panel.scrollTop = 0;
      cancelPointer();
      syncLock();
      syncIsolation();
      requestAnimationFrame(() => {
        if (workspace) syncSidebarPosition();
        if (workspace) $("h2",selected).focus({ preventScroll:true });
        else $(".panel-close").focus({ preventScroll:true });
      });
    }

    function closePanel() {
      if (!panelOpen) return;
      setDrawer(false,false);
      panelOpen = false;
      body.classList.remove("panelopen");
      syncLock();
      syncIsolation();
      if (panelReturn && !panelReturn.closest("#panel,#menu")) panelReturn.focus({ preventScroll:true });
      else menuBtn.focus({ preventScroll:true });
    }

    listen(document,"click", (event) => {
      const target = event.target;
      if (target.closest("[data-intro-skip]")) { finishIntro(); return; }
      if (target.closest("[data-intro-workspace]")) { finishIntro(); if (session) openWorkspace(); return; }
      if (target.closest("[data-watch-intro]")) { startIntro(true); return; }
      if (target.closest("[data-theme-toggle]")) { event.preventDefault(); setTheme(currentTheme === "light" ? "dark" : "light"); return; }
      if (handleWorkspaceAction(event)) return;
      if (target === lit || target.closest("[data-close]")) { closeShot(); return; }
      if (target.closest("[data-close-panel]")) { closePanel(); return; }
      const panelTrigger = target.closest("[data-panel]");
      if (panelTrigger) {
        event.preventDefault();
        const view = panelTrigger.dataset.panel;
        if (moduleIds.includes(view)) { if (session) openWorkspace(); else openLogin(); return; }
        openPanel(view);
        return;
      }
      if (target.closest("[data-grid]")) { event.preventDefault(); setGrid(true); return; }
      if (target.closest("#menuBtn")) { setMenu(!menuOpen); return; }
      if (target.closest("#gridBtn")) { setGrid(!gridOpen); return; }
      if (target.closest(".wordmark")) {
        event.preventDefault();
        if (menuOpen) setMenu(false,false);
        if (gridOpen) setGrid(false,false);
        state.velX = state.velY = state.dragX = state.dragY = 0;
        window.scrollTo(0,0);
        return;
      }
      const gridFigure = target.closest("#grid .rows figure");
      if (gridFigure) { openShot(Number(gridFigure.dataset.idx),gridFigure); return; }
      const keyboardCard = event.detail === 0 && target.closest(".card");
      if (keyboardCard) openShot(Number(keyboardCard.dataset.idx),keyboardCard);
    });
    listen($("#prevShot"),"click", () => navigateShot(-1));
    listen($("#nextShot"),"click", () => navigateShot(1));

    listen(document,"keydown", (event) => {
      if (introActive && event.key === "Escape") { event.preventDefault(); finishIntro(); return; }
      if (introActive && event.key === "Tab") {
        const buttons = $$("button",intro), first = buttons[0], last = buttons[buttons.length-1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === intro)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === intro)) { event.preventDefault(); first.focus(); }
        return;
      }
      if (event.key === "Escape" && body.classList.contains("ws-drawer-open")) {
        setDrawer(false);
        const toggleButton = $("[data-ws-drawer]");
        if (toggleButton) toggleButton.focus({ preventScroll:true });
        return;
      }
      if (event.key === "Escape") {
        if (body.classList.contains("finder-open")) { setFinder(false); return; }
        if (litOpen) closeShot();
        else if (panelOpen) closePanel();
        else if (menuOpen) setMenu(false);
        else if (gridOpen) setGrid(false);
        return;
      }
      if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setFinder(!body.classList.contains("finder-open"));
        return;
      }
      if (litOpen && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        navigateShot(event.key === "ArrowLeft" ? -1 : 1);
        return;
      }
      if (event.key === "Tab" && (litOpen || panelOpen || menuOpen)) {
        const root = litOpen ? lit : panelOpen ? panel : menu;
        const candidates = $$("a[href],button:not(:disabled),input,select,textarea,summary,[tabindex='0']",root)
          .filter((node) => node.tabIndex >= 0 && !node.disabled && node.getClientRects().length && !node.closest("[inert],[hidden]"));
        if (menuOpen) candidates.unshift(...$$("a[href],button:not(:disabled)",$("header")).filter((node) => node.tabIndex >= 0 && node.getClientRects().length && !node.closest("[inert]")));
        const first = candidates[0], last = candidates[candidates.length - 1];
        if (!first) return;
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        else if (!candidates.includes(document.activeElement)) { event.preventDefault(); first.focus(); }
        return;
      }
      const item = event.target.closest(".card,#grid .rows figure");
      if (item && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        openShot(Number(item.dataset.idx),item);
      } else if (item?.classList.contains("card") && ["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key)) {
        event.preventDefault();
        if (event.key === "ArrowLeft") state.dragX -= 6;
        if (event.key === "ArrowRight") state.dragX += 6;
        if (event.key === "ArrowUp") state.dragY -= 6;
        if (event.key === "ArrowDown") state.dragY += 6;
      }
    });

    listen(document,"pointermove", (event) => {
      if (!fine.matches || event.pointerType === "touch") return;
      cursor.tx = event.clientX;
      cursor.ty = event.clientY;
      if (!cursor.seen) { cursor.x = cursor.tx; cursor.y = cursor.ty; }
      cursor.seen = true;
      body.classList.add("has-pointer");
      dot.classList.toggle("wide", Boolean(event.target.closest(".card,a,button,#grid figure,summary")));
    }, { passive:true });
    listen(document,"pointerout", (event) => { if (!event.relatedTarget) body.classList.remove("has-pointer"); });
    listen($("#briefingForm"),"submit", (event) => {
      event.preventDefault();
      const values = new FormData(event.currentTarget);
      const get = (name) => String(values.get(name) || "").trim();
      const text = [
        "ResQSync / Deployment Brief", `Prepared: ${new Date().toISOString().slice(0,10)}`, "",
        `Name: ${get("name")}`, `Work email: ${get("email")}`, `Organization: ${get("organization")}`,
        `Response network: ${get("network")}`, "", "Resource conflicts to discuss:", get("needs") || "To be defined.", "",
        "Deployment review:", "- Resource types, participating agencies, and approved priority rules",
        "- Authorized requesters and commander approval paths", "- Hosting, data sovereignty, access, and retention requirements",
        "- Required HIPAA / CJIS terms and security approvals", "- Integration, mutual-aid, and procurement scope", "",
        "This brief was created locally in a product concept preview. No information was transmitted.",
        "No operational, clinical, certification, or availability commitments are created by this document.",
      ].join("\n");
      const url = URL.createObjectURL(new Blob([text],{ type:"text/plain;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "ResQSync-deployment-brief.txt";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url),10000);
      $("#briefingStatus").textContent = "Your brief is ready. The text-file download has been requested. No information was sent.";
    });

    function cardDecodeMax() { return innerWidth <= 380 ? 420 : innerWidth <= 640 ? 520 : innerWidth <= 900 ? 640 : 760; }
    async function downscale(image, cap, original) {
      if (image.naturalWidth <= cap) return original;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = cap;
        canvas.height = Math.max(1,Math.round(image.naturalHeight * cap / image.naturalWidth));
        const context = canvas.getContext("2d");
        if (!context) return original;
        context.drawImage(image,0,0,canvas.width,canvas.height);
        const blob = await new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(null),1200);
          canvas.toBlob((result) => { clearTimeout(timeout); resolve(result); },"image/webp",.88);
        });
        if (!blob) return original;
        const url = URL.createObjectURL(blob);
        blobUrls.push(url);
        return url;
      } catch { return original; }
    }
    const placeholder = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="#101010"/><path d="M0 220H170l28-42 42 88 37-46H600" fill="none" stroke="#4d4a47"/><text x="300" y="335" text-anchor="middle" fill="#8c8783" font-family="serif" font-size="19">ResQSync / Response Archive</text></svg>');
    shots.forEach((shot,index) => {
      const cardImage = $("img",cards[index]);
      const fallbackPhoto = shots[index % 5 === 0 ? 0 : index % 5 === 1 ? 2 : index % 5 === 2 ? 5 : index % 5 === 3 ? 8 : 14].image;
      const showImage = (url) => {
        thumbs[index] = url;
        cardImage.src = url;
        cardImage.classList.add("in");
        gridImages[index].src = url;
      };
      const onDisplayedError = (event) => {
        const image = event.currentTarget;
        image.onerror = null;
        image.src = fallbackPhoto;
        image.onerror = () => { image.onerror = null; image.src = placeholder; };
        if (image === cardImage) thumbs[index] = fallbackPhoto;
      };
      cardImage.onerror = onDisplayedError;
      gridImages[index].onerror = onDisplayedError;
      // Show the original immediately; decoded thumbnails are an enhancement.
      showImage(shot.image);
      const probe = new Image();
      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
      };
      const timeout = setTimeout(() => {
        if (settled) return;
        showImage(fallbackPhoto);
        settle();
      },5000);
      probe.crossOrigin = "anonymous";
      probe.onload = async () => {
        settle();
        try {
          showImage(await downscale(probe,cardDecodeMax(),shot.image));
          if (index === 2) $("#avatar").src = await downscale(probe,160,shot.image);
        } catch { showImage(shot.image); }
      };
      probe.onerror = settle;
      probe.src = shot.image;
    });
    $("#avatar").src = "https://images.pexels.com/photos/5964983/pexels-photo-5964983.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=120&w=120";

    // ---- Role workspaces: one shared store, a focused desk per role ----
    const STORE_KEY="resqsync-store-v2", SESSION_KEY="resqsync-session-v2";
    const STATUS_ORDER=["opened","verified","assigned","enroute","resolved"];
    const STATUS_LABEL={opened:"Opened",verified:"Verified",assigned:"Assigned",enroute:"En route",resolved:"Resolved"};
    const ROLE_ICONS={seeker:'<path d="M12 3.5 2.5 20h19L12 3.5Z"/><path d="M12 10v4.5M12 17.4h.01"/>',manager:'<path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12l1-8Z"/>',coordinator:'<path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4v-9Z"/><path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9"/>',admin:'<path d="M12 3 20 6v5.5c0 4.4-3 7.8-8 9.5-5-1.7-8-5.1-8-9.5V6l8-3Z"/>',viewer:'<circle cx="12" cy="12" r="3.2"/><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/>'};
    const ROLES={
      seeker:{label:"Help seeker",blurb:"Raise a help request and follow it from opened to resolved, like tracking a delivery.",tabs:["Raise a request","Track my requests"]},
      manager:{label:"Crisis manager",blurb:"Verify incoming requests and assign the right resource to each one.",tabs:["Incoming requests","Incident board"]},
      coordinator:{label:"Resource coordinator",blurb:"Hold the inventory, confirm dispatches, keep stock honest.",tabs:["Dispatch queue","Inventory"]},
      admin:{label:"Admin",blurb:"Full oversight of every request, resource and decision in the network.",tabs:["Overview","Audit trail"]},
    };
    function seedStore(){
      const t=(m)=>new Date(Date.now()-m*60000).toISOString();
      return { seq:44,
        resources:[
          {id:"R1",name:"Swiftwater rescue boat",type:"Equipment",total:6,assigned:2},
          {id:"R2",name:"ALS ambulance",type:"Equipment",total:8,assigned:5},
          {id:"R3",name:"Relief kits",type:"Supplies",total:1200,assigned:260},
          {id:"R4",name:"Medical oxygen cylinders",type:"Supplies",total:24,assigned:15},
        ],
        requests:[
          {id:"RSQ-0041",name:"S. Iyer",address:"12 Marine Drive, Kochi",phone:"+91 98470 11223",brief:"Roof access needed, water rising fast around the house.",adults:3,children:2,photo:null,status:"enroute",createdAt:t(160),resource:"Swiftwater rescue boat",history:[{at:t(160),label:"Request opened"},{at:t(150),label:"Verified by crisis manager"},{at:t(142),label:"Boat assigned"},{at:t(131),label:"Dispatch confirmed"}]},
          {id:"RSQ-0042",name:"A. Rahman",address:"Old City, Hyderabad",phone:"+91 90000 44556",brief:"Elderly patient needs an oxygen cylinder within the hour.",adults:2,children:0,photo:null,status:"assigned",createdAt:t(74),resource:"Medical oxygen cylinders",history:[{at:t(74),label:"Request opened"},{at:t(66),label:"Verified by crisis manager"},{at:t(58),label:"Oxygen assigned"}]},
          {id:"RSQ-0043",name:"P. Das",address:"Riverside colony, Guwahati",phone:"+91 98640 77889",brief:"Family stranded on the first floor, need evacuation and dry rations.",adults:4,children:3,photo:null,status:"verified",createdAt:t(22),resource:null,history:[{at:t(22),label:"Request opened"},{at:t(14),label:"Verified by crisis manager"}]},
        ],
        audit:[{at:t(160),actor:"Help seeker",action:"Raised RSQ-0041"},{at:t(150),actor:"Crisis manager",action:"Verified RSQ-0041"},{at:t(142),actor:"Crisis manager",action:"Assigned Swiftwater rescue boat to RSQ-0041"},{at:t(131),actor:"Resource coordinator",action:"Confirmed dispatch for RSQ-0041"}],
      };
    }
    let store;
    try{ const raw=JSON.parse(localStorage.getItem(STORE_KEY)||"null"); store=(raw&&Array.isArray(raw.requests)&&Array.isArray(raw.resources))?raw:seedStore(); }catch{ store=seedStore(); }
    function saveStore(){ try{ localStorage.setItem(STORE_KEY,JSON.stringify(store)); }catch{ /* session-only */ } }
    let session=null;
    try{ const savedSession=JSON.parse(localStorage.getItem(SESSION_KEY)||"null"); if(savedSession&&ROLES[savedSession.role]) session=savedSession; }catch{ session=null; }
    function setSession(role){
      session=role?{role}:null;
      try{ session?localStorage.setItem(SESSION_KEY,JSON.stringify(session)):localStorage.removeItem(SESSION_KEY); }catch{ /* session-only */ }
      syncAuthUI();
    }
    const authBtn=$("#authBtn");
    function syncAuthUI(){
      if(authBtn){ authBtn.textContent=session?ROLES[session.role].label:"Login"; authBtn.classList.toggle("is-authed",Boolean(session)); authBtn.title=session?"Signed in — select to sign out":"Sign in to a role workspace"; }
      const menuAuth=$(".menu-secondary [data-auth]"); if(menuAuth) menuAuth.textContent=session?"Sign out":"Sign in";
      const chip=$("#wsRoleChip"); if(chip) chip.textContent=session?ROLES[session.role].label:"";
    }
    function openLogin(){
      if(introActive) finishIntro({restoreFocus:false});
      const login=$("#login");
      $("#roleGrid").innerHTML=Object.entries(ROLES).map(([key,role])=>`<button type="button" class="role-card" data-role="${key}"><span class="role-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ROLE_ICONS[key]}</svg></span><span class="role-card-text"><b>${esc(role.label)}</b><small>${esc(role.blurb)}</small></span><span class="role-arrow"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h8m0 0-3-3m3 3-3 3"/></svg></span></button>`).join("");
      login.classList.add("is-open"); login.inert=false; login.setAttribute("aria-hidden","false");
      body.classList.add("login-open");
      requestAnimationFrame(()=>{ const first=$("#roleGrid .role-card"); if(first) first.focus(); });
    }
    function closeLogin(focusBack=true){
      const login=$("#login"); if(!login.classList.contains("is-open")) return;
      login.classList.remove("is-open"); login.inert=true; login.setAttribute("aria-hidden","true");
      body.classList.remove("login-open");
      if(focusBack&&authBtn) authBtn.focus({preventScroll:true});
    }
    function openWorkspace(){
      if(!session){ openLogin(); return; }
      openPanel("workspace");
      renderRoleWorkspace();
    }
    function findRequest(id){ return store.requests.find((r)=>r.id===id); }
    function pushStatus(req,label){ req.history.push({at:new Date().toISOString(),label}); }
    function trackerHTML(req){
      const idx=STATUS_ORDER.indexOf(req.status);
      return `<div class="tracker"><ol>${STATUS_ORDER.map((s,i)=>{ const h=req.history[i]; return `<li class="${i<idx?"done":i===idx?"now":""}"><i>${i<idx?"✓":i+1}</i><span>${STATUS_LABEL[s]}</span>${h?`<small>${when(h.at)}</small>`:""}</li>`; }).join("")}</ol></div>`;
    }
    function requestCard(req,actions){
      return `<article class="req-card st-${req.status}"><div class="req-card-top"><span class="req-id">${esc(req.id)} · ${when(req.createdAt)}</span><span class="req-status ${req.status}">${STATUS_LABEL[req.status]}</span></div>
      <div class="req-meta"><span>${esc(req.name)}</span><span>${esc(req.address)}</span><span>${esc(req.phone)}</span><span>${req.adults} adults · ${req.children} children</span></div>
      <p class="req-brief">${esc(req.brief)}</p>
      ${req.photo?`<div class="photo-preview"><img src="${req.photo}" alt="Verification photo for ${esc(req.id)}"><small>Verification photo</small></div>`:""}
      ${req.resource?`<div class="req-meta"><span>Assigned: <b>${esc(req.resource)}</b></span></div>`:""}
      ${trackerHTML(req)}
      ${actions||""}</article>`;
    }
    function resourceOptionsHTML(){ return store.resources.filter((r)=>r.assigned<r.total).map((r)=>`<option value="${esc(r.name)}">${esc(r.name)} (${r.total-r.assigned} free)</option>`).join(""); }
    function renderRoleWorkspace(){
      if(!session) return;
      const role=ROLES[session.role];
      $("[data-role-eyebrow]").textContent="ROLE WORKSPACE";
      $("[data-role-title]").textContent=role.label;
      $("[data-role-blurb]").textContent=role.blurb;
      const roleIcon=$("#wsRoleIcon"); if(roleIcon) roleIcon.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ROLE_ICONS[session.role]}</svg>`;
      syncAuthUI();
      const tabs=$("#roleTabs");
      if(tabs.dataset.role!==session.role){ tabs.dataset.role=session.role; tabs.dataset.tab="0"; }
      tabs.innerHTML=role.tabs.map((t,i)=>`<button type="button" role="tab" aria-selected="${tabs.dataset.tab===String(i)}" class="${tabs.dataset.tab===String(i)?"is-active":""}" data-role-tab="${i}">${esc(t)}</button>`).join("");
      const wrap=$("#roleWorkspace"); const tab=Number(tabs.dataset.tab||0);
      if(session.role==="seeker"){
        if(tab===0){
          wrap.innerHTML=`<form class="work-form req-card" id="raiseForm">
            <div class="work-form-grid">
              <label>Your name<input class="work-input" name="name" required maxlength="60" placeholder="Full name"></label>
              <label>Phone number<input class="work-input" name="phone" type="tel" required maxlength="20" placeholder="+91 …"></label>
              <label class="full">Address<input class="work-input" name="address" required maxlength="120" placeholder="House, street, town, district"></label>
              <label class="full">What help do you need?<textarea class="work-input" name="brief" required maxlength="240" rows="2" placeholder="Briefly describe the situation"></textarea></label>
              <label>Adults (approx.)<input class="work-input" name="adults" type="number" min="0" max="500" value="1" required></label>
              <label>Children (approx.)<input class="work-input" name="children" type="number" min="0" max="500" value="0" required></label>
              <label class="full">Photo for verification<input class="work-input" id="raisePhoto" type="file" accept="image/*"></label>
            </div>
            <div class="photo-preview" id="photoPreview" hidden><img alt="Verification photo preview"><small>Attached for verification</small></div>
            <div class="req-actions"><button class="work-btn primary" type="submit">Raise request</button><p style="color:var(--dim);font-size:11px">Your request reaches crisis managers immediately.</p></div>
          </form>`;
        } else {
          wrap.innerHTML=store.requests.length?store.requests.map((r)=>requestCard(r)).join(""):'<p class="work-empty">No requests yet. Raise one from the first tab.</p>';
        }
      } else if(session.role==="manager"){
        if(tab===0){
          const open=store.requests.filter((r)=>r.status!=="resolved");
          wrap.innerHTML=open.length?open.map((r)=>{
            let actions="";
            if(r.status==="opened") actions=`<div class="req-actions"><button class="work-btn primary" type="button" data-act="verify" data-id="${r.id}">Verify request</button></div>`;
            else if(r.status==="verified") actions=`<div class="req-actions"><select class="work-select" name="resource" style="max-width:260px">${resourceOptionsHTML()}</select><button class="work-btn primary" type="button" data-act="assign" data-id="${r.id}">Assign resource</button></div>`;
            else if(r.status==="enroute") actions=`<div class="req-actions"><button class="work-btn" type="button" data-act="resolve" data-id="${r.id}">Mark resolved</button></div>`;
            else if(r.status==="assigned") actions=`<div class="req-actions"><p style="color:var(--dim);font-size:11px">Waiting for the coordinator to confirm dispatch.</p></div>`;
            return requestCard(r,actions);
          }).join(""):'<p class="work-empty">No open requests right now.</p>';
        } else {
          wrap.innerHTML=`<div class="overview-stats">${[[""+store.requests.filter((r)=>r.status!=="resolved").length,"Open requests"],[""+store.requests.filter((r)=>r.status==="enroute").length,"En route"],[""+store.resources.reduce((s,r)=>s+r.assigned,0),"Units committed"],[""+store.audit.length,"Decisions logged"]].map(([v,l])=>`<div class="overview-stat"><b>${v}</b><span>${l}</span></div>`).join("")}</div>`+store.requests.filter((r)=>r.status!=="resolved").map((r)=>requestCard(r)).join("");
        }
      } else if(session.role==="coordinator"){
        if(tab===0){
          const queue=store.requests.filter((r)=>r.status==="assigned");
          wrap.innerHTML=queue.length?queue.map((r)=>requestCard(r,`<div class="req-actions"><button class="work-btn primary" type="button" data-act="dispatch" data-id="${r.id}">Confirm dispatch</button></div>`)).join(""):'<p class="work-empty">Nothing waiting for dispatch. Assigned requests appear here.</p>';
        } else {
          wrap.innerHTML=`<div class="table-scroll"><table class="work-table"><thead><tr><th>Resource</th><th>Type</th><th>Committed</th><th>Available</th></tr></thead><tbody>${store.resources.map((r)=>`<tr><td><b>${esc(r.name)}</b></td><td>${esc(r.type)}</td><td>${r.assigned} / ${r.total}</td><td><div class="capacity-bar" style="min-width:90px"><i style="width:${Math.round(r.assigned/r.total*100)}%"></i></div></td></tr>`).join("")}</tbody></table></div>`;
        }
      } else if(session.role==="admin"){
        if(tab===0){
          wrap.innerHTML=`<div class="overview-stats">${[[""+store.requests.length,"Total requests"],[""+store.requests.filter((r)=>r.status!=="resolved").length,"Open"],[""+store.resources.reduce((s,r)=>s+(r.total-r.assigned),0),"Units free"],[""+store.audit.length,"Audit entries"]].map(([v,l])=>`<div class="overview-stat"><b>${v}</b><span>${l}</span></div>`).join("")}</div><h3 class="section-title">Latest decisions</h3><ul class="decision-list">${store.audit.slice(0,8).map((a)=>`<li><small>${when(a.at)} · ${esc(a.actor)}</small>${esc(a.action)}</li>`).join("")}</ul>`;
        } else {
          wrap.innerHTML=`<ul class="decision-list">${store.audit.map((a)=>`<li><small>${when(a.at)} · ${esc(a.actor)}</small>${esc(a.action)}</li>`).join("")}</ul>`;
        }
      }
      $$("#roleWorkspace > *").forEach((el,i)=>{ el.style.animation=`riseIn .55s var(--ease) ${Math.min(i,8)*60}ms backwards`; });
    }
    let pendingPhoto=null;
    listen($("#roleTabs"),"click",(e)=>{ const b=e.target.closest("[data-role-tab]"); if(!b) return; $("#roleTabs").dataset.tab=b.dataset.roleTab; renderRoleWorkspace(); });
    listen($("#roleWorkspace"),"change",(e)=>{
      if(e.target.id!=="raisePhoto") return;
      const file=e.target.files&&e.target.files[0]; const prev=$("#photoPreview");
      if(!file||!file.type.startsWith("image/")){ if(prev) prev.hidden=true; pendingPhoto=null; return; }
      const reader=new FileReader();
      reader.onload=()=>{ pendingPhoto=String(reader.result); const img=prev?prev.querySelector("img"):null; if(img) img.src=pendingPhoto; if(prev) prev.hidden=false; };
      reader.readAsDataURL(file);
    });
    listen($("#roleWorkspace"),"submit",(e)=>{
      if(e.target.id!=="raiseForm") return; e.preventDefault();
      const f=e.target; const adults=Number(f.adults.value)||0, children=Number(f.children.value)||0;
      const id="RSQ-"+String(store.seq++).padStart(4,"0");
      const at=new Date().toISOString();
      store.requests.unshift({id,name:f.name.value.trim(),address:f.address.value.trim(),phone:f.phone.value.trim(),brief:f.brief.value.trim(),adults,children,photo:pendingPhoto,status:"opened",createdAt:at,resource:null,history:[{at,label:"Request opened"}]});
      store.audit.unshift({at,actor:"Help seeker",action:`Raised ${id}`});
      pendingPhoto=null; saveStore();
      $("#roleTabs").dataset.tab="1"; renderRoleWorkspace();
      showToast(`${id} raised. Track it under "Track my requests".`);
    });
    listen($("#roleWorkspace"),"click",(e)=>{
      const btn=e.target.closest("[data-act]"); if(!btn||!session) return;
      const req=findRequest(btn.dataset.id); if(!req) return;
      const act=btn.dataset.act; const now=new Date().toISOString(); const actor=ROLES[session.role].label;
      if(act==="verify"&&req.status==="opened"){ req.status="verified"; pushStatus(req,"Verified by crisis manager"); store.audit.unshift({at:now,actor,action:`Verified ${req.id}`}); }
      else if(act==="assign"&&req.status==="verified"){
        const sel=btn.parentElement.querySelector("select[name=resource]"); const name=sel?sel.value:null;
        const res=store.resources.find((r)=>r.name===name&&r.assigned<r.total);
        if(!res){ showToast("No available capacity in that pool."); return; }
        res.assigned+=1; req.resource=res.name; req.status="assigned"; pushStatus(req,`${res.name} assigned`); store.audit.unshift({at:now,actor,action:`Assigned ${res.name} to ${req.id}`});
      }
      else if(act==="dispatch"&&req.status==="assigned"){ req.status="enroute"; pushStatus(req,"Dispatch confirmed"); store.audit.unshift({at:now,actor,action:`Confirmed dispatch for ${req.id}`}); }
      else if(act==="resolve"&&(req.status==="enroute"||req.status==="assigned")){
        if(req.resource){ const res=store.resources.find((r)=>r.name===req.resource); if(res&&res.assigned>0) res.assigned-=1; }
        req.status="resolved"; pushStatus(req,"Marked resolved"); store.audit.unshift({at:now,actor,action:`Resolved ${req.id}`});
      } else return;
      saveStore(); renderRoleWorkspace(); showToast(`${req.id} is now ${STATUS_LABEL[req.status]}.`);
    });
    listen(document,"click",(e)=>{
      const roleCard=e.target.closest("[data-role]");
      if(roleCard){ setSession(roleCard.dataset.role); closeLogin(false); openWorkspace(); return; }
      if(e.target.closest("[data-login-close]")){ e.preventDefault(); closeLogin(); return; }
      if(e.target.closest("[data-switch-role]")){ e.preventDefault(); closePanel(); openLogin(); return; }
      if(e.target.closest("[data-auth]")){ e.preventDefault(); if(session){ setSession(null); closePanel(); showToast("Signed out."); } else openLogin(); return; }
    });
    listen(document,"keydown",(e)=>{ if(e.key==="Escape"&&body.classList.contains("login-open")) closeLogin(); });
    syncAuthUI();
    window.__resqsyncReady = true;
    syncIsolation();
    function scheduleIntroEnd(milliseconds,token = introGeneration) {
      clearTimeout(introEndTimer);
      introEndTimer = setTimeout(() => {
        if (token === introGeneration && introActive) finishIntro();
      },Math.max(0,milliseconds));
    }
    function startIntro(force = false) {
      if (!force && reduced.matches) return;
      clearTimeout(introEndTimer);
      clearTimeout(introFallbackTimer);
      clearTimeout(introHideTimer);
      const token = ++introGeneration;
      introReturn = menuOpen ? menuBtn : document.activeElement;
      if (litOpen) closeShot(false);
      if (panelOpen) closePanel();
      if (gridOpen) setGrid(false,false);
      if (menuOpen) setMenu(false,false);
      cancelPointer();
      state.velX = state.velY = 0;
      introActive = true;
      introStartedAt = performance.now();
      introDuration = reduced.matches ? 2400 : 5200;
      introProgress.style.transform = "scaleX(0)";
      intro.hidden = false;
      intro.classList.remove("is-closing","has-video");
      intro.classList.add("is-open");
      body.classList.add("intro-active");
      syncIsolation();
      syncLock();
      scheduleIntroEnd(introDuration,token);
      intro.focus({ preventScroll:true });
      // The image and motion appear immediately; film loading is never a gate.
      if (reduced.matches) return;
      introFallbackTimer = setTimeout(() => {
        if (token === introGeneration && introActive && !intro.classList.contains("has-video")) finishIntro();
      },2400);
      try {
        film.muted = true;
        film.defaultMuted = true;
        film.playsInline = true;
        film.setAttribute("webkit-playsinline","");
        if (!film.getAttribute("src")) film.src = film.dataset.src;
        else if (film.currentTime > .05) film.currentTime = 0;
        film.playbackRate = 2;
        const attempt = film.play();
        if (attempt && typeof attempt.catch === "function") attempt.catch(() => {
          if (token !== introGeneration || !introActive) return;
          introDuration = 2400;
          scheduleIntroEnd(Math.max(350,2400-(performance.now()-introStartedAt)),token);
        });
      } catch {
        introDuration = 2400;
        scheduleIntroEnd(Math.max(350,2400-(performance.now()-introStartedAt)),token);
      }
    }
    function finishIntro({ workspace = false,restoreFocus = true } = {}) {
      if (!introActive) return;
      introActive = false;
      const token = ++introGeneration;
      clearTimeout(introEndTimer);
      clearTimeout(introFallbackTimer);
      clearTimeout(introHideTimer);
      introProgress.style.transform = "scaleX(1)";
      intro.classList.add("is-closing");
      intro.classList.remove("is-open");
      body.classList.remove("intro-active");
      try { film.pause(); } catch { /* Media support does not affect access. */ }
      syncIsolation();
      syncLock();
      introHideTimer = setTimeout(() => {
        if (token !== introGeneration || introActive) return;
        intro.hidden = true;
        intro.classList.remove("is-closing","has-video");
      },reduced.matches ? 160 : 550);
      if (workspace) openPanel("overview");
      else if (restoreFocus) {
        const returnTo = introReturn && introReturn.isConnected && !introReturn.closest("[inert],[hidden]") && introReturn !== body ? introReturn : menuBtn;
        returnTo.focus({ preventScroll:true });
      }
    }
    listen(film,"play",() => { try { film.playbackRate = 2; } catch { /* Playback rate is optional. */ } });
    listen(film,"playing",() => {
      if (!introActive) { try { film.pause(); } catch { /* Optional playback. */ } return; }
      intro.classList.add("has-video");
      clearTimeout(introFallbackTimer);
      const remaining = Number.isFinite(film.duration) ? (film.duration-film.currentTime)/2*1000 : 3500;
      const age = performance.now()-introStartedAt;
      const delay = Math.max(200,Math.min(Math.max(1600-age,remaining),5200-age));
      introDuration = age + delay;
      scheduleIntroEnd(delay);
    });
    listen(film,"ended",() => { if (introActive) finishIntro(); });
    listen(film,"error",() => {
      if (!introActive) return;
      intro.classList.remove("has-video");
      introDuration = 2400;
      scheduleIntroEnd(Math.max(350,2400-(performance.now()-introStartedAt)));
    });
    listen(document,"visibilitychange",() => { if (document.hidden && introActive) finishIntro({ restoreFocus:false }); });
    window.__resqsyncReplayIntro = () => startIntro(true);
    window.__resqsyncSkipIntro = () => finishIntro();
    if (!new URLSearchParams(window.location.search).has("skipIntro") && !window.location.hash) startIntro();
    listen(window,"pagehide",(event) => { if (!event.persisted) blobUrls.forEach((url) => URL.revokeObjectURL(url)); });
  
  } catch (error) { dispose(); throw error; }
  return dispose;
}
