// @ts-nocheck
// Generated from the standalone controller. Run scripts/sync-archive.cjs to sync.
export function initializeArchive() {

  const abort = new AbortController();
  const timers = new Set();
  const frames = new Set();
  let disposed = false;
  const cleanupHooks = [];
  const onDispose = (hook) => { cleanupHooks.push(hook); };
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
    cleanupHooks.forEach((hook) => { try { hook(); } catch {} });
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
        note:"Admin, crisis manager, and resource coordinator are distinct responsibilities. Explore the demo as each role to see how available actions change. This is a permissions preview, not secure authentication.",
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
      { id:"crises",name:"Crisis Management",label:"Crises",number:"01",description:"Keep track of what's happening, where, and how serious it is.",features:["Crisis event creation and tracking","Status updates saved for everyone: active, escalating, resolved","Severity levels and incident categories","Timeline of events and actions","Geographic coordinates, plotted locations, and map links"] },
      { id:"resources",name:"Resource Management",label:"Resources",number:"02",description:"See what you have, what's free, and what's already committed.",features:["Personnel, equipment, supplies, and facilities inventory","Availability and assigned-capacity tracking","Resource allocation to active crises","Capability profiles and specifications","Usage history and maintenance logs"] },
      { id:"conflicts",name:"Conflict Resolution",label:"Allocations",number:"03",description:"When two incidents need the same thing, decide who gets it first.",features:["Automatic detection of competing resource requests","Transparent severity / response-time priority scoring","Manual override and approval workflows","Stakeholder notifications and decision records","Negotiation, compromise, and decision history"] },
      { id:"users",name:"Users & Roles",label:"People & access",number:"04",description:"Who's on the team, and what each person can do.",features:["Admin, crisis manager, and resource coordinator roles","Multi-organization and agency profiles","Role-based permissions enforced by the server","Individual sign-in with e-mail and password","Activity audit logs and account administration"] },
      { id:"collaboration",name:"Communication & Collaboration",label:"Messages & files",number:"05",description:"Updates, notes, and files, kept with the incident they belong to.",features:["Live messaging: new messages appear for everyone signed in","E-mail, SMS, and push preferences (e-mail needs SMTP configured)","Comment threads attached to crises and decisions","Document upload and download stored on the server","In-app stakeholder notifications"] },
      { id:"analytics",name:"Analytics & Reporting",label:"Reports",number:"06",description:"How resources are being used, and how quickly teams respond.",features:["Dashboard with calculated key metrics","Resource utilization reports by resource type","Response time analytics from sample records","Historical incident trends and date-range selection","Native PDF download and Excel-compatible XML export"] },
      { id:"decision",name:"Decision Support",label:"Scenario planning",number:"07",description:"Try an allocation on paper before you commit to it.",features:["Automated resource-allocation recommendation heuristic","Impact assessment through covered and uncovered demand","Scenario simulation with adjustable capacity and priority weights","Indicative INR cost and coverage analysis","Saved simulations with an audit trail"] },
    ];
    const moduleIds = ["overview",...featureModules.map((module) => module.id)];
    const roleNames = { admin:"Admin","crisis-manager":"Crisis manager","resource-coordinator":"Resource coordinator","help-seeker":"Help seeker" };
    const severityNames = { 1:"Low",2:"Moderate",3:"Elevated",4:"High",5:"Critical" };
    const ui = { module:"overview",role:"help-seeker",credential:null,crisisQuery:"",crisisFilter:"all",crisisTab:"list",selectedCrisis:"C-MUM",resourceQuery:"",resourceFilter:"all",selectedResource:null,communicationTab:"messages",channel:"network",analyticsDays:30,simulation:null,conflictResource:"R-VENT" };
    let toastTimer = 0;
    const isoAgo = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();
    // All records live on the ResQSync server; this object is only the last snapshot the server sent.
    const emptyWorkspace = () => ({ loaded:false,revision:0,crises:[],resources:[],requests:[],users:[],messages:[],notifications:[],attachments:[],decisions:[],negotiations:[],simulations:[],audit:[],plans:{},preferences:{ email:false,sms:false,push:false },metrics:{ active:0,conflicts:0,utilization:0,response:0 },config:{},analytics:{},analyticsLoading:0,analyticsError:null,outbox:[],adminOutbox:[] });
    let db = emptyWorkspace();
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
    const disabled = (action) => has(action) ? "" : ' disabled title="Your role does not allow this action"';
    function showToast(text) {
      clearTimeout(toastTimer);
      const toast = $("#workToast");
      toast.textContent = text;
      toast.hidden = false;
      toastTimer = setTimeout(() => toast.hidden = true,4500);
    }
    function requireRole(action) {
      if (has(action)) return true;
      showToast("Your role cannot make that change.");
      return false;
    }
    // ---- Server connection ----
    class ApiError extends Error { constructor(message,status) { super(message); this.status = status; } }
    async function api(method,path,payload) {
      const options = { method,credentials:"same-origin",headers:{ Accept:"application/json" } };
      if (payload instanceof FormData) options.body = payload;
      else if (payload !== undefined) { options.headers["Content-Type"] = "application/json"; options.body = JSON.stringify(payload); }
      let response;
      try { response = await fetch(`/api${path}`,options); }
      catch { throw new ApiError("Cannot reach the ResQSync server. Check your connection and try again.",0); }
      const authCall = /^\/auth\/(login|register|me)/.test(path);
      if (response.status === 401 && !authCall) {
        handleSessionLost();
        const lost = new ApiError("Your session has ended. Sign in again.",401);
        lost.handled = true;
        throw lost;
      }
      if (!response.ok) {
        let detail = `The request failed (${response.status}).`;
        try { const data = await response.json(); if (data && data.detail) detail = typeof data.detail === "string" ? data.detail : "Some of the details are not valid."; } catch { /* keep the generic message */ }
        throw new ApiError(detail,response.status);
      }
      return response;
    }
    const apiJson = async (method,path,payload) => (await api(method,path,payload)).json();
    const enc = encodeURIComponent;
    let knownRevision = 0;
    async function loadMyOutbox() {
      try {
        const items = await apiJson("GET","/me/outbox");
        db.outbox = Array.isArray(items) ? items : [];
      } catch {
        db.outbox = [];
      }
    }
    async function loadAdminOutbox() {
      if (!has("users")) return;
      try {
        const items = await apiJson("GET","/outbox");
        db.adminOutbox = Array.isArray(items) ? items : [];
      } catch {
        db.adminOutbox = [];
      }
    }
    async function loadWorkspace() {
      const data = await apiJson("GET","/workspace");
      data.loaded = true;
      data.analytics = {};
      data.analyticsLoading = 0;
      data.analyticsError = null;
      data.outbox = db.outbox || [];
      data.adminOutbox = db.adminOutbox || [];
      db = data;
      knownRevision = Math.max(knownRevision,data.revision);
      loadMyOutbox();
      if (has("users")) loadAdminOutbox();
    }
    // Run a server change, then reload everything the signed-in role can see, then confirm to the person.
    function mutate(request,success,before,resync = false) {
      return request.then(async (result) => {
        if (before) before(result);
        await refreshAll();
        showToast(typeof success === "function" ? success(result) : success);
        return result;
      }).catch((error) => {
        if (!error.handled) { showToast(error.message || "That change could not be saved."); if (resync) refreshAll().catch(() => {}); }
        return null;
      });
    }
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
    function initLeafletMap() {
      const container = document.getElementById("realLeafletMap");
      if (!container || typeof L === "undefined") return;
      if (container._leaflet_map) {
        container._leaflet_map.invalidateSize();
        return;
      }
      try {
        const map = L.map("realLeafletMap", { zoomControl:true }).setView([21.5, 78.9], 5);
        container._leaflet_map = map;
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        }).addTo(map);

        const sevColors = { 1: "#10b981", 2: "#06b6d4", 3: "#f59e0b", 4: "#f97316", 5: "#ef4444" };
        const visible = filteredCrises();
        visible.forEach((c) => {
          const color = sevColors[c.severity] || "#ef4444";
          const marker = L.circleMarker([c.lat, c.lng], {
            radius: 8 + (c.severity * 2),
            fillColor: color,
            color: "#ffffff",
            weight: 2,
            opacity: 0.95,
            fillOpacity: 0.85
          }).addTo(map);

          const popupHtml = `<div style="color:#111;font-family:Inter,sans-serif;min-width:180px;line-height:1.4">
            <strong style="font-size:13px;display:block;margin-bottom:2px">${esc(c.title)}</strong>
            <span style="font-size:11px;color:#555">${esc(c.city)}, ${esc(c.region)}</span>
            <div style="margin:6px 0;display:flex;gap:6px;align-items:center">
              <span style="display:inline-block;padding:2px 6px;border-radius:3px;background:${color};color:#fff;font-size:10px;font-weight:bold">Severity ${c.severity} · ${esc(severityNames[c.severity])}</span>
              <span style="font-size:10px;text-transform:uppercase;font-weight:600;color:#444">${esc(c.status)}</span>
            </div>
            <div style="font-size:11px;margin-bottom:8px">Estimated impacted: <b>${fmt(c.population)}</b></div>
            <button type="button" class="work-btn primary" style="padding:4px 8px;font-size:11px;cursor:pointer;width:100%" data-map-open-crisis="${esc(c.id)}">Open incident record &rarr;</button>
          </div>`;
          marker.bindPopup(popupHtml);
        });

        const stagingDepots = [
          { name: "Western Staging Depot", city: "Mumbai", lat: 19.076, lng: 72.8777, org: "Western Response Collective" },
          { name: "Eastern Staging Depot", city: "Guwahati", lat: 26.1445, lng: 91.7362, org: "Eastern Relief Network" },
          { name: "Southern Staging Hub", city: "Bengaluru", lat: 12.9716, lng: 77.5946, org: "Southern Response Collective" },
          { name: "Northern Trauma Base", city: "New Delhi", lat: 28.6139, lng: 77.2090, org: "Regional Trauma Consortium" }
        ];
        stagingDepots.forEach((s) => {
          const depotMarker = L.circleMarker([s.lat, s.lng], {
            radius: 8,
            fillColor: "#8b5cf6",
            color: "#ffffff",
            weight: 2,
            opacity: 0.95,
            fillOpacity: 0.9
          }).addTo(map);
          const pools = db.resources.filter((r) => r.organization === s.org);
          const depotHtml = `<div style="color:#111;font-family:Inter,sans-serif;min-width:180px;line-height:1.4">
            <strong style="font-size:12px;color:#6d28d9;display:block">⬡ ${esc(s.name)}</strong>
            <span style="font-size:11px;color:#555">${esc(s.org)} · ${esc(s.city)}</span>
            <div style="margin:6px 0;font-size:11px;border-top:1px solid #e5e7eb;padding-top:4px">
              <b>${pools.length}</b> resource inventory pools:<br>
              <div style="margin-top:2px;font-size:10px;color:#374151">${pools.map((r) => `• ${esc(r.name)}: <b>${available(r)}</b> ${esc(r.unit)} available`).join("<br>")}</div>
            </div>
          </div>`;
          depotMarker.bindPopup(depotHtml);
        });

        setTimeout(() => map.invalidateSize(), 150);
      } catch (err) {
        console.error("Leaflet initialization error:", err);
      }
    }
    function crisisMap() {
      const visible = filteredCrises();
      return `<div class="geo-map-wrapper" style="margin-top:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div><span class="overline" style="margin:0">Interactive Geographic Response Map</span><br><small style="color:var(--dim)">Leaflet / OpenStreetMap · ${visible.length} plotted incidents &amp; staging depots</small></div>
          <div style="display:flex;gap:10px;font-size:11px;align-items:center;flex-wrap:wrap">
            <span style="display:flex;align-items:center;gap:4px"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ef4444"></i> Sev 5</span>
            <span style="display:flex;align-items:center;gap:4px"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#f97316"></i> Sev 4</span>
            <span style="display:flex;align-items:center;gap:4px"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#f59e0b"></i> Sev 3</span>
            <span style="display:flex;align-items:center;gap:4px"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#06b6d4"></i> Sev 2</span>
            <span style="display:flex;align-items:center;gap:4px"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#10b981"></i> Sev 1</span>
            <span style="display:flex;align-items:center;gap:4px"><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#8b5cf6"></i> Depot</span>
          </div>
        </div>
        <div id="realLeafletMap" style="height:420px;width:100%;border-radius:var(--ws-radius,8px);position:relative;z-index:1;background:var(--chart-bg);border:1px solid var(--line-soft)"></div>
        <p class="map-footnote" style="margin-top:8px">${visible.length} matching incidents. Click any incident or depot marker to inspect details and open records.</p>
      </div>`;
    }
    function crisesView() {
      return `<div class="workspace-tools"><div><input class="work-input search-field" id="crisisSearch" type="search" placeholder="Search incidents or locations" value="${esc(ui.crisisQuery)}" aria-label="Search incidents"><select class="work-select" id="crisisFilter" aria-label="Filter incident status">${["all","active","escalating","resolved"].map((status) => `<option value="${status}"${selectedAttr(status,ui.crisisFilter)}>${status === "all" ? "All statuses" : status[0].toUpperCase()+status.slice(1)}</option>`).join("")}</select></div><div style="display:flex;gap:8px"><a class="work-btn" href="/api/exports/crises.csv" download="crises.csv" style="text-decoration:none">Export CSV ↗</a><button type="button" class="work-btn primary" data-toggle-form="newCrisis"${disabled("crisis")}>Create crisis +</button></div></div><form class="work-form inline-form" id="newCrisis" data-work-form="crisis" hidden><h3>Create a training incident</h3><div class="work-form-grid"><label class="full">Crisis name<input class="work-input" name="title" required maxlength="90" placeholder="District flood-response exercise"></label><label>City / district<input class="work-input" name="city" required maxlength="60" placeholder="Mumbai"></label><label>State / region<input class="work-input" name="region" required maxlength="60" placeholder="Maharashtra"></label><label>Category<select class="work-select" name="category">${["Flood","Fire","Medical","Landslide","Storm","Earthquake","Other"].map((category) => `<option>${category}</option>`).join("")}</select></label><label>Severity<select class="work-select" name="severity">${[5,4,3,2,1].map((severity) => `<option value="${severity}">${severityNames[severity]}</option>`).join("")}</select></label><label>Latitude<input class="work-input" name="lat" type="number" min="6" max="37" step=".0001" required value="19.076"></label><label>Longitude<input class="work-input" name="lng" type="number" min="67" max="98" step=".0001" required value="72.8777"></label><label>Estimated people affected<input class="work-input" name="population" type="number" min="0" max="1000000" step="1" value="0" required></label><label>Initial status<select class="work-select" name="status"><option value="active">Active</option><option value="escalating">Escalating</option></select></label></div><div class="form-actions"><button class="work-btn primary" type="submit">Create training incident</button><button class="work-btn" type="button" data-toggle-form="newCrisis">Cancel</button><p>Use fictional information only.</p></div></form><div class="work-tabs" aria-label="Crisis display"><button type="button" data-crisis-tab="list" class="${ui.crisisTab === "list" ? "is-active" : ""}" aria-pressed="${ui.crisisTab === "list"}">Incident list</button><button type="button" data-crisis-tab="map" class="${ui.crisisTab === "map" ? "is-active" : ""}" aria-pressed="${ui.crisisTab === "map"}">Geographic view</button></div>${ui.crisisTab === "map" ? crisisMap() : `<div class="table-scroll"><table class="work-table"><thead><tr><th>Incident</th><th>Location</th><th>Severity</th><th>Status</th><th>Record</th></tr></thead><tbody id="crisisRows">${crisisRows()}</tbody></table></div>`}${crisisDetail(crisisById(ui.selectedCrisis))}`;
    }

    function resourceRows() {
      const rows = db.resources.filter((resource) => (ui.resourceFilter === "all" || resource.type === ui.resourceFilter) && `${resource.name} ${resource.organization} ${resource.capability}`.toLowerCase().includes(ui.resourceQuery.toLowerCase()));
      return rows.length ? rows.map((resource) => `<tr><td><button type="button" class="row-link" data-resource-detail="${esc(resource.id)}">${esc(resource.name)}</button><small>${esc(resource.type)} / ${esc(resource.organization)}</small></td><td>${fmt(resource.total)}<small>${esc(resource.unit)}</small></td><td>${resource.maintenance ? statusLabel("maintenance") : `${fmt(available(resource))}${resource.lowStock ? ' <span class="state-label critical" style="font-size:10px">Low stock</span>' : ''}<small>${used(resource)} assigned</small>`}</td><td><div class="capacity-bar" style="min-width:65px"><i style="width:${resource.maintenance ? 0 : Math.min(100,used(resource)/resource.total*100)}%"></i></div><small>${resource.maintenance ? "Out of service" : `${Math.round(used(resource)/resource.total*100)}% utilized`}</small></td><td><button type="button" class="work-btn" data-resource-detail="${esc(resource.id)}">Profile ↗</button></td></tr>`).join("") : '<tr><td colspan="5" class="work-empty">No matching resources.</td></tr>';
    }
    function resourceDetail(resource) {
      if (!resource) return "";
      const lowStockBanner = resource.lowStock ? `<div style="background:rgba(239,68,68,0.18);border:1px solid #ef4444;border-radius:4px;padding:6px 10px;margin-bottom:12px;font-size:12px;color:#fca5a5">⚠️ <b>Low-stock alert:</b> Only ${fmt(available(resource))} ${esc(resource.unit)} remaining in this inventory pool.</div>` : "";
      return `<section class="module-detail"><div class="detail-heading"><div><h3>${esc(resource.name)}</h3><small>${esc(resource.id)} / ${esc(resource.type)} / ${esc(resource.organization)}</small></div><button type="button" data-hide-resource>Hide profile ×</button></div>${lowStockBanner}<div class="details-grid"><div><p class="detail-note">${esc(resource.capability)}</p><p class="detail-note" style="margin-top:10px">Indicative daily cost per ${esc(resource.unit)}: ${money(resource.cost)}.</p><div class="detail-controls"><button type="button" class="work-btn" data-maintenance="${esc(resource.id)}"${disabled("resource")}>${resource.maintenance ? "Return to available" : "Mark for maintenance"}</button></div><form class="work-form" data-work-form="patchResource" data-resource-id="${esc(resource.id)}" style="margin-top:12px"><div style="display:flex;gap:8px;align-items:flex-end"><label style="flex:1">Total capacity (${esc(resource.unit)})<input name="total" type="number" class="work-input" min="${resource.used}" max="1000000" value="${resource.total}" required></label><button type="submit" class="work-btn"${disabled("resource")}>Update capacity</button></div></form><details class="ws-collapse" style="margin-top:10px"><summary>Record stock movement (In / Out)<i aria-hidden="true">+</i></summary><form class="work-form" data-work-form="stockMovement" data-resource-id="${esc(resource.id)}" style="margin-top:8px"><div class="work-form-grid"><label>Movement type<select name="movementType" class="work-select"><option value="stock_in">Stock-in (Add units)</option><option value="stock_out">Stock-out (Deduct units)</option></select></label><label>Quantity<input name="quantity" type="number" class="work-input" min="1" max="1000000" value="1" required></label><label class="full">Reason / Reference<input name="reason" class="work-input" required maxlength="250" placeholder="e.g. Warehouse receipt or district transfer"></label></div><div class="form-actions"><button type="submit" class="work-btn primary"${disabled("resource")}>Save movement</button></div></form></details><h4 class="section-title">Current assignments</h4><ul class="decision-list">${resource.allocations.length ? resource.allocations.map((allocation) => `<li><small>${esc(when(allocation.at))} IST</small>${fmt(allocation.quantity)} ${esc(resource.unit)} / ${allocation.requestId ? `Help request ${esc(allocation.requestId)}` : esc(crisisById(allocation.crisisId)?.title || "Unknown incident")}<br>${allocation.requestId ? '<span class="module-count">Released when the request is resolved</span>' : `<button class="text-action" type="button" data-release="${esc(resource.id)}" data-release-crisis="${esc(allocation.crisisId)}"${disabled("allocate")}>Release assignment ↗</button>`}</li>`).join("") : '<li>No active assignments.</li>'}</ul></div><div><p class="overline" style="margin-bottom:10px">Usage history</p><ol class="timeline">${resource.history.slice(0,6).map((event) => `<li><time>${esc(shortTime(event.at))}</time><span>${esc(event.text)}<br><span style="color:var(--dim)">${esc(event.actor)}</span></span></li>`).join("")}</ol><p class="overline" style="margin:22px 0 10px">Maintenance log</p><ol class="timeline">${resource.maintenanceLog.slice(0,4).map((event) => `<li><time>${esc(shortTime(event.at))}</time><span>${esc(event.text)}</span></li>`).join("")}</ol></div></div></section>`;
    }
    function resourcesView() {
      return `<div class="workspace-tools"><div><input class="work-input search-field" id="resourceSearch" type="search" placeholder="Search resource inventory" value="${esc(ui.resourceQuery)}" aria-label="Search inventory"><select class="work-select" id="resourceFilter" aria-label="Filter resource type"><option value="all">All resource types</option>${["Personnel","Equipment","Supplies","Facilities"].map((type) => `<option${selectedAttr(type,ui.resourceFilter)}>${type}</option>`).join("")}</select></div><div style="display:flex;gap:8px"><a class="work-btn" href="/api/exports/resources.csv" download="resources.csv" style="text-decoration:none">Export CSV ↗</a><button type="button" class="work-btn" data-toggle-form="assignResource"${disabled("allocate")}>Assign resources ↗</button><button type="button" class="work-btn primary" data-toggle-form="newResource"${disabled("resource")}>Add resource +</button></div></div><form class="work-form inline-form" id="newResource" data-work-form="resource" hidden><h3>Add an inventory pool</h3><div class="work-form-grid"><label>Resource name<input class="work-input" name="name" required maxlength="80" placeholder="District rescue vehicles"></label><label>Type<select class="work-select" name="type">${["Personnel","Equipment","Supplies","Facilities"].map((type) => `<option>${type}</option>`).join("")}</select></label><label>Total capacity<input class="work-input" name="total" type="number" min="1" max="1000000" step="1" required value="5"></label><label>Unit name<input class="work-input" name="unit" required maxlength="30" placeholder="vehicles"></label><label>Organization<input class="work-input" name="organization" required maxlength="70" placeholder="Training response collective"></label><label>Daily unit cost / INR<input class="work-input" name="cost" type="number" min="0" max="10000000" step="1" required value="1000"></label><label class="full">Capabilities and specifications<textarea class="work-input" name="capability" required maxlength="350" rows="2" placeholder="Capacity, qualifications, operating constraints, readiness..."></textarea></label></div><div class="form-actions"><button type="submit" class="work-btn primary">Add inventory pool</button><button type="button" class="work-btn" data-toggle-form="newResource">Cancel</button></div></form><form class="work-form inline-form" id="assignResource" data-work-form="assign" hidden><h3>Assign available capacity</h3><div class="work-form-grid"><label>Resource<select name="resourceId" class="work-select" required>${resourceOptions()}</select></label><label>Active crisis<select name="crisisId" class="work-select" required>${crisisOptions()}</select></label><label>Quantity<input name="quantity" class="work-input" type="number" min="1" max="1000000" value="1" step="1" required></label><label>Assignment rationale<input name="reason" class="work-input" required maxlength="220" placeholder="Agreed operational need"></label></div><div class="form-actions"><button type="submit" class="work-btn primary">Confirm demo assignment</button><button type="button" class="work-btn" data-toggle-form="assignResource">Cancel</button></div></form><div class="table-scroll"><table class="work-table"><thead><tr><th>Resource / organization</th><th>Capacity</th><th>Available</th><th>Utilization</th><th>Details</th></tr></thead><tbody id="resourceRows">${resourceRows()}</tbody></table></div>${resourceDetail(resourceById(ui.selectedResource))}`;
    }

    // The ranking itself is calculated and enforced on the server (severity-weighted, deterministic, never above available capacity).
    const planFor = (resource) => db.plans[resource.id] || [];
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
      return `<div class="workspace-tools"><div><span class="state-label critical">${pools.length} pools under demand pressure</span></div><div><button type="button" class="work-btn" data-toggle-form="newRequest"${disabled("allocate")}>Add a competing request +</button><button type="button" class="work-btn" data-recalculate>Recalculate priorities ↻</button></div></div><p class="demo-notice">Suggestions are ranked by severity (65%) and recorded response time (35%), and never exceed what's actually available. A person always makes the final call.</p><form class="work-form inline-form" id="newRequest" data-work-form="request" hidden><h3>Add a resource request</h3><div class="work-form-grid"><label>Resource pool<select name="resourceId" class="work-select" required>${resourceOptions(chosen.id)}</select></label><label>Active crisis<select name="crisisId" class="work-select" required>${crisisOptions()}</select></label><label>Additional requested quantity<input name="quantity" class="work-input" type="number" min="1" max="1000000" step="1" value="2" required></label><label>Reason<input name="reason" class="work-input" required maxlength="200" placeholder="Unmet operational demand"></label></div><div class="form-actions"><button type="submit" class="work-btn primary">Record request</button><button type="button" class="work-btn" data-toggle-form="newRequest">Cancel</button></div></form>${pools.length ? pools.map((resource) => {
        const plan = planFor(resource), demand = plan.reduce((sum,item) => sum+item.quantity,0);
        return `<section class="conflict-item"><div class="conflict-top"><div><h3>${esc(resource.name)}</h3><p>${fmt(demand)} additional ${esc(resource.unit)} requested / ${fmt(available(resource))} available / ${plan.length > 1 ? "competing incidents" : "uncovered demand"}</p></div><button type="button" class="work-btn primary" data-approve-pool="${esc(resource.id)}"${!has("approve") || available(resource) === 0 ? " disabled" : ""}>Approve recommendation ↗</button></div>${plan.map((item) => `<div class="allocation-line"><span>${esc(item.crisis.city)} / ${esc(item.crisis.title)}</span><small>Score ${item.score}</small><div class="capacity-bar"><i style="width:${item.score}%"></i></div><b>${item.allocation} / ${item.quantity}</b></div>`).join("")}<p class="map-footnote">Proposed assignment / requested quantity. Shortfall: ${fmt(Math.max(0,demand-available(resource)))} ${esc(resource.unit)}. ${resource.maintenance ? "This pool is unavailable for maintenance." : "A manager or admin must approve."}</p></section>`;
      }).join("") : '<p class="work-empty">No current resource shortfalls. Add competing requests to explore the workflow.</p>'}<details class="ws-collapse"><summary>Need something different?<small>Override the suggestion or propose a compromise</small><i aria-hidden="true">+</i></summary><form class="work-form" data-work-form="override"><div class="work-form-grid"><label>Resource pool<select name="resourceId" class="work-select" required>${resourceOptions(chosen.id)}</select></label><label>Active crisis<select name="crisisId" class="work-select" required>${crisisOptions()}</select></label><label>Quantity to allocate<input name="quantity" class="work-input" type="number" min="1" max="1000000" step="1" value="1" required></label><label>Recorded override reason<input name="reason" class="work-input" required minlength="8" maxlength="250" placeholder="Explain why the recommendation should change"></label></div><div class="form-actions"><button type="submit" class="work-btn"${disabled("approve")}>Record override &amp; allocate</button><p>Capacity limits still apply.</p></div></form><form class="work-form" data-work-form="negotiation"><div class="work-form-grid"><label>Resource<select name="resourceId" class="work-select">${resourceOptions(chosen.id)}</select></label><label>Compromise proposal<input name="proposal" class="work-input" required minlength="5" maxlength="350" placeholder="Share capacity now, arrange partner backfill later..."></label></div><div class="form-actions"><button type="submit" class="work-btn"${disabled("allocate")}>Log negotiation proposal</button></div></form></details>${db.negotiations.length ? `<ul class="decision-list" style="margin-top:20px">${db.negotiations.slice(0,6).map((entry) => `<li><small>${esc(when(entry.at))} IST / ${esc(entry.actor)} / ${esc(resourceById(entry.resourceId)?.name)}</small>${esc(entry.proposal)}<div class="detail-controls">${statusLabel(entry.status)}${entry.status === "pending" ? `<button type="button" class="work-btn" data-agree-negotiation="${esc(entry.id)}"${disabled("approve")}>Record agreement</button>` : ""}</div></li>`).join("")}</ul>` : ""}<h3 class="section-title">Decision record</h3>${db.decisions.length ? `<ul class="decision-list">${db.decisions.slice(0,8).map((decision) => `<li><small>${esc(when(decision.at))} IST / ${esc(decision.actor)} / ${esc(decision.type)}</small>${esc(decision.text)}</li>`).join("")}</ul>` : '<p class="work-empty">Approve a recommendation or record an override to create a decision record and a stakeholder notice.</p>'}`;
    }

    function credentialBox() {
      if (!ui.credential) return "";
      const c = ui.credential;
      return `<div class="req-card credential-box" role="status"><b>Temporary password for ${esc(c.name)} (${esc(c.email)})</b><p style="margin:8px 0"><code>${esc(c.password)}</code></p><p style="color:var(--dim);font-size:12px">Copy it now. It is shown only once; the person must change it after signing in.</p><button type="button" class="work-btn" data-dismiss-credential>Done</button></div>`;
    }
    function passwordForm() {
      return `<details class="ws-collapse"><summary>Account, privacy &amp; password<i aria-hidden="true">+</i></summary><div style="padding:14px 18px 6px"><div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap"><button type="button" class="work-btn" data-download-my-data style="font-size:12px">Download my data (JSON) 📥</button><button type="button" class="work-btn" data-open-delete-account style="font-size:12px;color:#fca5a5;border-color:rgba(239,68,68,0.4)">Delete my account 🗑</button><button type="button" class="work-btn" data-open-privacy style="font-size:12px">Privacy &amp; Data Notice 📜</button></div></div><form class="work-form" data-work-form="password" autocomplete="off"><div class="work-form-grid"><label>Current password<input class="work-input" name="current" type="password" autocomplete="current-password" required></label><label>New password<input class="work-input" name="next" type="password" autocomplete="new-password" required minlength="10" maxlength="128"></label></div><div class="form-actions"><button type="submit" class="work-btn primary">Update password</button><p>At least 10 characters, with letters and a number or symbol.</p></div></form></details>`;
    }
    function usersView() {
      const adminOutboxSection = has("users") ? `<details class="ws-collapse" style="margin-top:24px"><summary style="display:flex;justify-content:space-between;align-items:center"><span>System Outbox &amp; Delivery Log (${(db.adminOutbox || []).length})</span><button type="button" class="work-btn" data-refresh-admin-outbox style="font-size:11px;padding:2px 8px">Refresh ↻</button></summary><div class="table-scroll" style="margin-top:10px"><table class="work-table"><thead><tr><th>Channel</th><th>Recipient</th><th>Status</th><th>Retries</th><th>Dispatched / Created</th></tr></thead><tbody>${(db.adminOutbox && db.adminOutbox.length) ? db.adminOutbox.map((msg) => `<tr><td><b>${esc(msg.channel.toUpperCase())}</b></td><td>${esc(msg.recipient)}</td><td><span class="state-label ${msg.status === 'sent' ? 'active' : msg.status === 'failed' ? 'critical' : msg.status === 'not_configured' ? 'high' : 'pending'}">${esc(msg.status)}</span>${msg.error ? `<br><small style="color:var(--red);font-size:10px">${esc(msg.error)}</small>` : ''}</td><td>${msg.attempts} / ${msg.maxAttempts}</td><td><small>${esc(msg.deliveredAt ? when(msg.deliveredAt) : when(msg.createdAt))} IST</small></td></tr>`).join("") : '<tr><td colspan="5" class="work-empty">No outbound notifications logged across the system yet. Click Refresh to load.</td></tr>'}</tbody></table></div></details>` : '';
      const retentionDays = Number(db.config?.dataRetentionDays || 0);
      const retentionBanner = `<div class="req-card" style="margin:20px 0;padding:12px 16px;background:var(--surface);border:1px solid var(--line-soft);border-radius:6px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px"><div><span style="font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:0.06em">Data Retention &amp; Auto-Anonymisation:</span> <b style="margin-left:6px;color:var(--ink)">${retentionDays > 0 ? `${retentionDays} days (Active)` : 'Disabled (Default)'}</b><p style="margin:4px 0 0;font-size:11px;color:var(--dim)">Resolved emergency requests older than ${retentionDays > 0 ? retentionDays + ' days' : 'configured threshold'} have names, phones, addresses and verification photos erased.</p></div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${has("users") ? `<button type="button" class="work-btn" data-run-retention-pass style="font-size:11px;padding:3px 8px">Run retention pass now ↻</button>` : ''}<button type="button" class="work-btn" data-open-privacy style="font-size:11px;padding:3px 8px">Privacy Notice 📜</button></div></div>`;
      return `<div class="workspace-tools"><div><span class="module-count">${db.users.length} users / ${new Set(db.users.map((user) => user.organization)).size} organizations</span></div><button type="button" class="work-btn primary" data-toggle-form="newUser"${disabled("users")}>Add a user +</button></div><p class="workspace-warning">Every person signs in with their own account. These roles are enforced by the server on every action, not just in this screen.</p>${credentialBox()}<form class="work-form inline-form" id="newUser" data-work-form="user" hidden><h3>Create a user account</h3><div class="work-form-grid"><label>Name<input name="name" class="work-input" required maxlength="65" placeholder="Priya Sen"></label><label>Email<input name="email" class="work-input" type="email" required maxlength="120" placeholder="priya@example.org"></label><label>Organization<input name="organization" class="work-input" required maxlength="75" placeholder="Relief collective"></label><label>Role<select name="role" class="work-select">${roleOptions("crisis-manager")}</select></label></div><div class="form-actions"><button type="submit" class="work-btn primary">Create account</button><button type="button" class="work-btn" data-toggle-form="newUser">Cancel</button><p>A temporary password is generated and shown once. The person must change it after first sign-in.</p></div></form><div class="table-scroll"><table class="work-table"><thead><tr><th>User</th><th>Organization</th><th>Role</th><th>Access status</th></tr></thead><tbody>${db.users.map((user) => `<tr><td>${esc(user.name)}<small>${esc(user.email)}</small></td><td>${esc(user.organization)}</td><td><select class="work-select" data-user-role="${esc(user.id)}" aria-label="Role for ${esc(user.name)}"${disabled("users")}>${roleOptions(user.role)}</select></td><td>${esc(user.status)}${has("users") && String(user.id) !== String(db.me?.id) ? `<div class="detail-controls"><button type="button" class="text-action" data-user-status="${esc(user.id)}" data-next="${user.status === "Active" ? "disabled" : "active"}">${user.status === "Active" ? "Disable" : "Re-enable"}</button><button type="button" class="text-action" data-user-reset="${esc(user.id)}">Reset password</button><button type="button" class="text-action danger-text" data-user-anonymise="${esc(user.id)}" style="color:#fca5a5">Anonymise 🛡</button></div>` : ""}</td></tr>`).join("")}</tbody></table></div>${passwordForm()}<details class="ws-collapse"><summary>What each role can do<i aria-hidden="true">+</i></summary><div class="table-scroll"><table class="role-matrix"><thead><tr><th>Action</th><th>Admin</th><th>Crisis manager</th><th>Resource coordinator</th></tr></thead><tbody><tr><td>View incidents &amp; reports</td><td>Yes</td><td>Yes</td><td>Yes</td></tr><tr><td>Create &amp; update crises</td><td>Yes</td><td>Yes</td><td>—</td></tr><tr><td>Edit inventory &amp; maintenance</td><td>Yes</td><td>—</td><td>Yes</td></tr><tr><td>Assign available resources</td><td>Yes</td><td>Yes</td><td>Yes</td></tr><tr><td>Approve or override priorities</td><td>Yes</td><td>Yes</td><td>—</td></tr><tr><td>Manage users &amp; roles</td><td>Yes</td><td>—</td><td>—</td></tr></tbody></table></div></details>${retentionBanner}<div style="display:flex;justify-content:space-between;align-items:center;margin:24px 0 10px"><h3 class="section-title" style="margin:0">Activity audit log</h3><a class="work-btn" href="/api/exports/audit.csv" download="audit.csv" style="text-decoration:none">Export CSV ↗</a></div>${auditList(db.audit.slice(0,12))}${adminOutboxSection}`;
    }

    function channelOptions(chosen) {
      return `<option value="network"${selectedAttr(chosen,"network")}>Network coordination</option><option value="decisions"${selectedAttr(chosen,"decisions")}>Decision discussion</option>${db.crises.map((crisis) => `<option value="${esc(crisis.id)}"${selectedAttr(chosen,crisis.id)}>Incident / ${esc(crisis.city)} / ${esc(crisis.title)}</option>`).join("")}`;
    }
    function collaborationView() {
      const tabs = [["messages","Messages & comments"],["notifications",`Notifications (${db.notifications.filter((item) => !item.read).length})`],["documents","Documents"]];
      const top = `<div class="workspace-tools"><div class="work-tabs" aria-label="Collaboration sections">${tabs.map(([id,label]) => `<button type="button" data-communication-tab="${id}" class="${ui.communicationTab === id ? "is-active" : ""}" aria-pressed="${ui.communicationTab === id}">${esc(label)}</button>`).join("")}</div></div>`;
      if (ui.communicationTab === "notifications") {
        const isPhoneVerified = Boolean(db.me?.phoneVerified);
        const phoneNum = db.me?.phone || "";
        const emailReady = Boolean(db.config.emailDelivery);
        const smsReady = Boolean(db.config.smsDelivery);
        const pushReady = Boolean(db.config.pushDelivery);

        const providerInfo = `<div class="req-card" style="margin-bottom:14px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;padding:10px 14px;background:var(--surface);border:1px solid var(--line-soft);border-radius:4px;"><span style="font-size:12px;color:var(--dim)">Delivery Services:</span><span class="state-label ${emailReady ? 'active' : 'moderate'}">Email: ${emailReady ? 'Connected' : 'Not configured'}</span><span class="state-label ${smsReady ? 'active' : 'moderate'}">SMS: ${smsReady ? 'Connected' : 'Not configured'}</span><span class="state-label ${pushReady ? 'active' : 'moderate'}">Push: ${pushReady ? 'Connected' : 'Not configured'}</span></div>`;

        const phoneSection = `<div class="req-card" style="margin-bottom:16px;background:var(--surface);border:1px solid var(--line-soft);padding:12px 14px;border-radius:4px;"><div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px"><div><span style="font-size:12px;color:var(--dim)">Emergency Dispatch Phone:</span> <b style="margin-left:4px">${esc(phoneNum || "No phone added")}</b> <span style="margin-left:8px" class="state-label ${isPhoneVerified ? 'active' : 'critical'}">${isPhoneVerified ? 'Verified ✓' : 'Unverified'}</span></div>${phoneNum && !isPhoneVerified ? `<div style="display:inline-flex;gap:6px;align-items:center"><button type="button" class="work-btn" data-send-phone-otp>Send OTP</button><input type="text" id="phoneOtpInput" class="work-input" placeholder="6-digit code" maxlength="6" style="width:100px;padding:4px 8px;font-size:12px" aria-label="Verification OTP"><button type="button" class="work-btn primary" data-verify-phone-otp>Verify OTP</button></div>` : ''}</div>${!isPhoneVerified ? `<p style="margin:6px 0 0;font-size:11px;color:var(--dim)">Emergency dispatch alerts via SMS require a verified mobile number.</p>` : ''}</div>`;

        const channelSettings = `<div class="channel-settings">${[["email","Email"],["sms","SMS"],["push","Push"]].map(([key,label]) => {
          const isSms = key === "sms";
          const canSms = isPhoneVerified;
          const isChecked = Boolean(db.preferences[key]);
          const smsDisabled = isSms && !canSms;
          return `<label style="display:inline-flex;align-items:center;gap:6px;margin-right:14px;cursor:${smsDisabled?'not-allowed':'pointer'}"><input type="checkbox" data-notification-pref="${key}"${isChecked ? " checked" : ""}${smsDisabled ? ' disabled title="Phone verification required"' : disabled("save")}>${label} preference ${smsDisabled ? '<small style="color:var(--amber);font-size:11px">(Requires verified phone)</small>' : ''}</label>`;
        }).join("")}</div>`;

        const outboxList = `<details class="ws-collapse" style="margin-top:22px" open><summary style="display:flex;justify-content:space-between;align-items:center"><span>Dispatched Outbox Log (${(db.outbox || []).length})</span><button type="button" class="work-btn" data-refresh-my-outbox style="font-size:11px;padding:2px 8px">Refresh ↻</button></summary><div class="table-scroll" style="margin-top:10px"><table class="work-table"><thead><tr><th>Channel</th><th>Recipient</th><th>Status</th><th>Retries</th><th>Delivered / Created</th></tr></thead><tbody>${(db.outbox && db.outbox.length) ? db.outbox.map((msg) => `<tr><td><b>${esc(msg.channel.toUpperCase())}</b></td><td>${esc(msg.recipient)}</td><td><span class="state-label ${msg.status === 'sent' ? 'active' : msg.status === 'failed' ? 'critical' : msg.status === 'not_configured' ? 'high' : 'pending'}">${esc(msg.status)}</span>${msg.error ? `<br><small style="color:var(--red);font-size:10px">${esc(msg.error)}</small>` : ''}</td><td>${msg.attempts} / ${msg.maxAttempts}</td><td><small>${esc(msg.deliveredAt ? when(msg.deliveredAt) : when(msg.createdAt))} IST</small></td></tr>`).join("") : '<tr><td colspan="5" class="work-empty">No outbound notifications recorded for your account yet.</td></tr>'}</tbody></table></div></details>`;

        return `${top}${providerInfo}${phoneSection}${channelSettings}<button type="button" class="work-btn" data-mark-notifications>Mark notices as read</button><ul class="messages">${db.notifications.length ? db.notifications.map((notice) => `<li><div class="message-head"><span>${notice.read ? "Read" : "Unread"} / ${esc(notice.channel)}</span><small>${esc(when(notice.at))} IST</small></div><p>${esc(notice.text)}</p></li>`).join("") : '<li class="work-empty">No notices yet. Update a crisis or approve an allocation.</li>'}</ul>${outboxList}`;
      }
      const channelPicker = `<div class="workspace-tools"><div><label class="overline" for="messageChannel">Thread</label><select id="messageChannel" class="work-select" aria-label="Select a collaboration thread">${channelOptions(ui.channel)}</select></div></div>`;
      if (ui.communicationTab === "documents") {
        const documents = db.attachments.filter((file) => file.channel === ui.channel);
        return `${top}${channelPicker}<p class="demo-notice">Files are uploaded to the ResQSync server and stay attached to this thread for everyone with access.</p><form class="work-form inline-form" data-work-form="attachment"><div class="work-form-grid"><label class="full">Attach a document<input name="file" id="workFile" class="work-input" type="file" required accept=".pdf,.csv,.txt,.json,.png,.jpg,.jpeg"${disabled("message")}></label></div><div class="form-actions"><button type="submit" class="work-btn primary"${disabled("message")}>Attach to this thread</button><p>PDF, CSV, text, JSON, PNG, JPG. Maximum 5 MB.</p></div></form><ul class="file-list">${documents.length ? documents.map((file) => `<li><div>${esc(file.name)}<small>${fmt(Math.ceil(file.size/1024))} KB / ${esc(file.author)} / ${esc(when(file.at))} IST</small></div><button type="button" class="work-btn" data-download-attachment="${esc(file.id)}">Download ↗</button></li>`).join("") : '<li class="work-empty">No documents attached to this thread yet.</li>'}</ul>`;
      }
      const messages = db.messages.filter((message) => message.channel === ui.channel);
      return `${top}${channelPicker}<ul class="messages">${messages.length ? messages.map((message) => `<li><div class="message-head"><span>${esc(message.author)}</span><small>${esc(when(message.at))} IST</small></div><p>${esc(message.text)}</p><div class="message-meta">${ui.channel === "network" ? "Network message" : ui.channel === "decisions" ? "Decision comment" : "Incident comment"} </div></li>`).join("") : '<li class="work-empty">Start a conversation in this thread.</li>'}</ul><form class="work-form" data-work-form="message" style="margin-top:25px"><label>Message / comment<textarea name="text" class="work-input" rows="3" required minlength="2" maxlength="1200" placeholder="Share an update, question, or decision rationale..."${disabled("message")}></textarea></label><div class="form-actions"><button type="submit" class="work-btn primary"${disabled("message")}>Post message ↗</button><p>Everyone signed in sees new messages as soon as they are posted.</p></div></form>`;
    }

    function ensureAnalytics() {
      const days = ui.analyticsDays;
      if (db.analytics[days] || db.analyticsLoading === days) return;
      db.analyticsLoading = days;
      apiJson("GET",`/analytics?days=${days}`)
        .then((data) => { db.analytics[days] = data; db.analyticsError = null; })
        .catch((error) => { db.analyticsError = error.message; })
        .finally(() => { if (db.analyticsLoading === days) db.analyticsLoading = 0; if (ui.module === "analytics" && panelOpen) renderWorkspace("analytics"); });
    }
    function utilizationRows(report) {
      return report.utilization.map((row) => `<div class="util-row"><span>${esc(row.type)}</span><div class="capacity-bar"><i style="width:${row.percent}%"></i></div><span>${row.percent}%</span></div>`).join("");
    }
    function trendSvg(report) {
      const counts = report.trend.map((point) => point.count), days = counts.length, span = Math.max(1,days-1);
      const max = Math.max(1,...counts);
      const points = counts.map((count,index) => `${35+index/span*420},${205-count/max*145}`).join(" ");
      return `<svg class="trend-chart" viewBox="0 0 490 255" role="img" aria-label="Incidents created over the last ${days} days: ${counts.join(", ")}"><path d="M35 60H455M35 130H455M35 205H455" fill="none" stroke="#33402e" stroke-width="1"/><polyline class="trend-line" points="${points}" fill="none" stroke="#b9c9b4" stroke-width="2"/>${counts.map((count,index) => `<circle cx="${35+index/span*420}" cy="${205-count/max*145}" r="3" fill="#b9c9b4"/>`).join("")}<g fill="#8c9386" font-family="Inter, sans-serif" font-size="8"><text x="35" y="235">${days} days ago</text><text x="432" y="235">Today</text><text x="15" y="64">${max}</text><text x="18" y="208">0</text></g></svg>`;
    }
    function analyticsView() {
      const ranges = [7,30,60,90];
      const tools = `<div class="workspace-tools"><div><select id="analyticsRange" class="work-select" aria-label="Reporting date range">${ranges.map((days) => `<option value="${days}"${selectedAttr(ui.analyticsDays,days)}>Last ${days} days</option>`).join("")}</select></div><div><button type="button" class="work-btn" data-export="pdf">Export PDF ↓</button><button type="button" class="work-btn" data-export="excel">Export Excel ↓</button></div></div>`;
      const report = db.analytics[ui.analyticsDays];
      if (!report) {
        if (!db.analyticsError) ensureAnalytics();
        return `${tools}<p class="work-empty">${db.analyticsError ? `${esc(db.analyticsError)} <button type="button" class="text-action" data-retry-analytics>Try again</button>` : "Loading report data…"}</p>`;
      }
      const severityRows = report.bySeverity.map((row) => `<tr><td>${esc(row.label)}</td><td>${row.count}</td></tr>`).join("");
      const allocationRows = report.allocationsByDay.length ? report.allocationsByDay.map((row) => `<tr><td>${esc(row.date)}</td><td>${row.count}</td></tr>`).join("") : '<tr><td colspan="2" class="work-empty">No allocations recorded in this range.</td></tr>';
      return `${tools}${statLine([[report.incidents,"Incidents in range"],[report.resolved,"Resolved incidents"],[`${report.meanUtilization}%`,"Current mean pool utilization"],[`${report.meanResponse} min`,"Mean recorded response"]])}<div class="analytics-grid"><section><div class="chart-heading"><h3>Incident trend</h3><small>Created events / ${report.trend.length} days</small></div>${trendSvg(report)}<p class="map-footnote">Counts of incidents created per day (India time).</p></section><section><div class="chart-heading"><h3>Resource utilization</h3><small>Current inventory</small></div>${utilizationRows(report)}<p class="map-footnote">Each category averages its non-maintenance pool percentages; different physical units are not summed.</p></section></div><div class="analytics-grid"><section><div class="chart-heading"><h3>Incidents by severity</h3><small>In range</small></div><div class="table-scroll"><table class="work-table"><thead><tr><th>Severity</th><th>Incidents</th></tr></thead><tbody>${severityRows}</tbody></table></div></section><section><div class="chart-heading"><h3>Allocation activity</h3><small>Assignments approved per day</small></div><div class="table-scroll"><table class="work-table"><thead><tr><th>Date</th><th>Assignments</th></tr></thead><tbody>${allocationRows}</tbody></table></div></section></div><h3 class="section-title">Response time by incident</h3><div class="table-scroll"><table class="work-table"><thead><tr><th>Incident</th><th>Category</th><th>Status</th><th>Recorded response</th></tr></thead><tbody>${report.responses.length ? report.responses.map((row) => `<tr><td>${esc(row.title)}<small>${esc(row.city)}</small></td><td>${esc(row.category)}</td><td>${statusLabel(row.status)}</td><td>${Number.isFinite(row.responseMinutes) ? `${row.responseMinutes} min` : "Not yet recorded"}</td></tr>`).join("") : '<tr><td colspan="4" class="work-empty">No events in this date range.</td></tr>'}</tbody></table></div><p class="map-footnote">PDF and Excel reports are generated by the server from the same records. Response time is measured from when an incident is created to its first assignment.</p>`;
    }

    function decisionView() {
      const initial = resourceById("R-VENT") || db.resources[0];
      return `<p class="demo-notice">Scenarios are a safe sandbox: running one changes nothing. Adjust the numbers and see how an allocation would land.</p><form class="work-form" data-work-form="simulation"><div class="scenario-controls"><label>Resource pool<select id="simulationPool" name="resourceId" class="work-select">${resourceOptions(initial.id)}</select></label><label>Scenario pool capacity<input name="capacity" id="simulationCapacity" type="number" min="0" max="1000000" step="1" value="${available(initial)}" required class="work-input"></label><label>Severity weight / <output id="severityWeightLabel">65%</output><input name="weight" id="severityWeight" type="range" min="20" max="90" step="5" value="65"></label><label>Cost per resource per day / INR<input name="cost" id="simulationCost" class="work-input" type="number" min="0" max="10000000" step="1" value="${initial.cost}" required></label></div><div class="form-actions"><button type="submit" class="work-btn primary">Run scenario ↗</button><p>The remaining score weight uses recorded response-time readiness.</p></div></form><div id="simulationResult" class="scenario-result">${ui.simulation ? simulationResult(ui.simulation) : '<p class="work-empty">Adjust a scenario and run it to see proposed allocations, uncovered demand, and an indicative cost comparison.</p>'}</div><details class="ws-collapse"><summary>Saved scenarios<i aria-hidden="true">+</i></summary>${db.simulations.length ? `<ul class="decision-list">${db.simulations.slice(0,6).map((simulation) => `<li><small>${esc(when(simulation.at))} IST / ${esc(simulation.actor)}</small>${esc(simulation.resourceName)} / ${simulation.capacity} available / ${simulation.covered} proposed / ${simulation.demand-simulation.covered} uncovered / ${money(simulation.covered*simulation.cost)} indicative allocation cost</li>`).join("")}</ul>` : '<p class="work-empty">Nothing saved yet. Run a scenario and save it to keep the assumptions alongside the result.</p>'}</details>`;
    }
    function simulationResult(simulation) {
      const uncovered = Math.max(0,simulation.demand-simulation.covered);
      return `${statLine([[`${simulation.demand ? Math.round(simulation.covered/simulation.demand*100) : 0}%`,"Requested demand covered"],[simulation.covered,"Units proposed"],[uncovered,"Units still uncovered"],[money(simulation.covered*simulation.cost),"Indicative daily allocation cost"]])}<div class="table-scroll"><table class="work-table"><thead><tr><th>Request</th><th>Priority score</th><th>Requested</th><th>Proposed</th></tr></thead><tbody>${simulation.rows.length ? simulation.rows.map((row) => `<tr><td>${esc(row.title)}<small>${esc(row.city)}</small></td><td>${row.score}</td><td>${row.quantity}</td><td>${row.allocation}</td></tr>`).join("") : '<tr><td colspan="4" class="work-empty">No open requests for this resource. Add requests in Conflict Resolution to compare scenarios.</td></tr>'}</tbody></table></div><p class="map-footnote">Assumptions: ${simulation.weight}% severity / ${100-simulation.weight}% response-time readiness. Pool cost at full use: ${money(simulation.capacity*simulation.cost)} per day. Unused scenario capacity: ${simulation.capacity-simulation.covered}. Coverage is not a clinical outcome measure.</p><div class="form-actions"><button type="button" class="work-btn" data-save-simulation${disabled("save")}>Save scenario to audit trail</button><button type="button" class="work-btn" data-simulation-conflict>Review live requests ↗</button></div>`;
    }
    function renderWorkspace(moduleId) {
      if (!moduleIds.includes(moduleId)) moduleId = "overview";
      if (!db.loaded) { $("#workspaceContent").innerHTML = '<p class="work-empty">Loading the shared picture…</p>'; return; }
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
      const resetButton = $("[data-reset-demo]");
      if (resetButton) resetButton.hidden = !(has("users") && db.config.allowDemoReset);
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
      if (moduleId === "crises" && ui.crisisTab === "map") { setTimeout(initLeafletMap, 60); }
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
    async function exportReport(kind) {
      try {
        const response = await api("GET",`/reports/export?format=${kind === "pdf" ? "pdf" : "xml"}&days=${ui.analyticsDays}`);
        downloadFile(await response.blob(),kind === "pdf" ? "ResQSync-report.pdf" : "ResQSync-report.xml");
        showToast(kind === "pdf" ? "PDF report downloaded." : "Excel workbook downloaded. Open the .xml file in Excel.");
      } catch (error) { if (!error.handled) showToast(error.message); }
    }
    async function downloadAttachment(id) {
      try {
        const file = db.attachments.find((item) => item.id === id);
        const response = await api("GET",`/attachments/${enc(id)}/download`);
        downloadFile(await response.blob(),file ? file.name : "attachment");
      } catch (error) { if (!error.handled) showToast(error.message); }
    }

    async function downloadMyData() {
      try {
        showToast("Generating your personal data export...");
        const response = await api("GET","/me/data");
        downloadFile(await response.blob(),`resqsync_my_data_${Date.now()}.json`);
        showToast("Personal data export downloaded.");
      } catch (error) { if (!error.handled) showToast(error.message); }
    }
    let modalReturnFocus = null;
    function openDeleteAccountModal() {
      const modal = $("#deleteAccountModal");
      if (!modal) return;
      modalReturnFocus = document.activeElement;
      modal.classList.add("is-open");
      modal.inert = false;
      modal.setAttribute("aria-hidden","false");
      const pwd = $("#deleteAccountPassword");
      if (pwd) pwd.value = "";
      const chk = $("#deleteAccountConfirm");
      if (chk) chk.checked = false;
      const err = $("#delAccountError");
      if (err) { err.hidden = true; err.textContent = ""; }
      requestAnimationFrame(() => { if (pwd) pwd.focus(); });
    }
    function closeDeleteAccountModal() {
      const modal = $("#deleteAccountModal");
      if (!modal || !modal.classList.contains("is-open")) return;
      modal.classList.remove("is-open");
      modal.inert = true;
      modal.setAttribute("aria-hidden","true");
      if (modalReturnFocus && typeof modalReturnFocus.focus === "function") {
        modalReturnFocus.focus({ preventScroll:true });
      }
    }
    let privacyPolicyLoaded = false;
    async function openPrivacyModal() {
      const modal = $("#privacyModal");
      if (!modal) return;
      modalReturnFocus = document.activeElement;
      modal.classList.add("is-open");
      modal.inert = false;
      modal.setAttribute("aria-hidden","false");
      const content = $("#privacyModalContent");
      if (content && !privacyPolicyLoaded) {
        content.innerHTML = '<div style="text-align:center;padding:24px;color:var(--dim)">Loading privacy disclosures...</div>';
        try {
          const data = await apiJson("GET","/privacy/policy");
          privacyPolicyLoaded = true;
          let html = '<div style="display:grid;gap:14px">';
          if (data.categories) {
            html += '<div><b style="color:var(--ink)">Data Categories Collected:</b><ul style="margin:6px 0 0 18px;padding:0">';
            data.categories.forEach(c => { html += `<li><b>${esc(c.name)}:</b> ${esc(c.description)}</li>`; });
            html += '</ul></div>';
          }
          if (data.purposes) {
            html += '<div><b style="color:var(--ink)">Purposes of Processing:</b><ul style="margin:6px 0 0 18px;padding:0">';
            data.purposes.forEach(p => { html += `<li>${esc(p)}</li>`; });
            html += '</ul></div>';
          }
          if (data.governance_controls) {
            html += '<div><b style="color:var(--ink)">Governance &amp; Privacy Controls:</b><ul style="margin:6px 0 0 18px;padding:0">';
            data.governance_controls.forEach(g => { html += `<li>${esc(g)}</li>`; });
            html += '</ul></div>';
          }
          if (data.retention_policy) {
            html += `<div style="background:var(--surface);padding:8px 12px;border-radius:4px;border:1px solid var(--line-soft)"><b style="color:var(--ink)">Retention Policy:</b> ${esc(data.retention_policy)}</div>`;
          }
          html += '</div>';
          content.innerHTML = html;
        } catch (err) {
          content.innerHTML = `<p style="color:var(--red)">Failed to load privacy notice: ${esc(err.message)}</p>`;
        }
      }
      requestAnimationFrame(() => {
        const closeBtn = modal.querySelector("[data-close-privacy-modal]");
        if (closeBtn) closeBtn.focus();
      });
    }
    function closePrivacyModal() {
      const modal = $("#privacyModal");
      if (!modal || !modal.classList.contains("is-open")) return;
      modal.classList.remove("is-open");
      modal.inert = true;
      modal.setAttribute("aria-hidden","true");
      if (modalReturnFocus && typeof modalReturnFocus.focus === "function") {
        modalReturnFocus.focus({ preventScroll:true });
      }
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
      const mapCrisis = target.closest("[data-map-open-crisis]");
      if (mapCrisis) { ui.selectedCrisis = mapCrisis.dataset.mapOpenCrisis; ui.crisisTab = "list"; renderWorkspace("crises"); return true; }
      if (target.closest("[data-refresh-admin-outbox]")) { apiJson("GET","/admin/outbox").then((res)=>{ db.adminOutbox = res.messages || []; renderWorkspace("users"); }).catch(()=>{}); return true; }
      const resourceDetailButton = target.closest("[data-resource-detail]");
      if (resourceDetailButton) { ui.selectedResource = resourceDetailButton.dataset.resourceDetail; renderWorkspace("resources"); return true; }
      if (target.closest("[data-hide-resource]")) { ui.selectedResource = null; renderWorkspace("resources"); return true; }
      const discuss = target.closest("[data-discuss]");
      if (discuss) { ui.channel = discuss.dataset.discuss; ui.communicationTab = "messages"; openPanel("collaboration"); return true; }
      const maintenance = target.closest("[data-maintenance]");
      if (maintenance) {
        if (!requireRole("resource")) return true;
        mutate(apiJson("POST",`/resources/${enc(maintenance.dataset.maintenance)}/maintenance`),(result) => result.message);
        return true;
      }
      const release = target.closest("[data-release]");
      if (release) {
        if (!requireRole("allocate")) return true;
        mutate(apiJson("POST",`/resources/${enc(release.dataset.release)}/release`,{ crisisId:release.dataset.releaseCrisis }),"Assignment released. Inventory and the crisis timeline have been updated.");
        return true;
      }
      const approve = target.closest("[data-approve-pool]");
      if (approve) {
        if (!requireRole("approve")) return true;
        mutate(apiJson("POST",`/resources/${enc(approve.dataset.approvePool)}/approve`),"Recommendation approved and recorded. Inventory and incident timelines were updated.");
        return true;
      }
      if (target.closest("[data-recalculate]")) { refreshAll().then(() => showToast("Recommendations recalculated from current availability and open requests.")).catch((error) => { if (!error.handled) showToast(error.message); }); return true; }
      const negotiation = target.closest("[data-agree-negotiation]");
      if (negotiation) {
        if (!requireRole("approve")) return true;
        mutate(apiJson("POST",`/negotiations/${enc(negotiation.dataset.agreeNegotiation)}/agree`),"Agreement recorded. This does not automatically move any resource.");
        return true;
      }
      const communicationTab = target.closest("[data-communication-tab]");
      if (communicationTab) { ui.communicationTab = communicationTab.dataset.communicationTab; renderWorkspace("collaboration"); return true; }
      if (target.closest("[data-mark-notifications]")) { mutate(apiJson("POST","/notifications/read"),"All notices marked as read."); return true; }
      const attachment = target.closest("[data-download-attachment]");
      if (attachment) { downloadAttachment(attachment.dataset.downloadAttachment); return true; }
      const exportButton = target.closest("[data-export]");
      if (exportButton) { exportReport(exportButton.dataset.export === "pdf" ? "pdf" : "excel"); return true; }
      if (target.closest("[data-retry-analytics]")) { db.analyticsError = null; renderWorkspace("analytics"); return true; }
      if (target.closest("[data-save-simulation]")) {
        if (!requireRole("save") || !ui.simulation) return true;
        const { resourceId,capacity,cost,weight } = ui.simulation;
        mutate(apiJson("POST","/simulations",{ resourceId,capacity,cost,weight }),"Simulation saved with its assumptions. Inventory was not changed.");
        return true;
      }
      if (target.closest("[data-simulation-conflict]")) { if (ui.simulation) ui.conflictResource = ui.simulation.resourceId; openPanel("conflicts"); return true; }
      if (target.closest("[data-dismiss-credential]")) { ui.credential = null; renderWorkspace("users"); return true; }
      const userStatus = target.closest("[data-user-status]");
      if (userStatus) {
        if (!requireRole("users")) return true;
        mutate(apiJson("PATCH",`/users/${enc(userStatus.dataset.userStatus)}`,{ status:userStatus.dataset.next }),"Account updated. Any open sessions for that person were ended.");
        return true;
      }
      const userReset = target.closest("[data-user-reset]");
      if (userReset) {
        if (!requireRole("users")) return true;
        mutate(apiJson("PATCH",`/users/${enc(userReset.dataset.userReset)}`,{ reset_password:true }),"Password reset. Share the temporary password with the person securely.",(result) => {
          const person = db.users.find((item) => String(item.id) === String(userReset.dataset.userReset));
          ui.credential = { name:person?.name || "the user",email:person?.email || "",password:result.temporaryPassword };
        });
        return true;
      }
      const userAnon = target.closest("[data-user-anonymise]");
      if (userAnon) {
        if (!requireRole("users")) return true;
        const targetId = userAnon.dataset.userAnonymise;
        const targetPerson = db.users.find((item) => String(item.id) === String(targetId));
        const confirmMsg = `Are you sure you want to permanently anonymise "${targetPerson?.name || 'this user'}"? All profile PII and associated emergency requests will be scrubbed, and active sessions revoked. The audit trail remains intact.`;
        if (confirm(confirmMsg)) {
          mutate(apiJson("POST",`/users/${enc(targetId)}/anonymise`),"User has been anonymised on privacy erasure request.");
        }
        return true;
      }
      const runRet = target.closest("[data-run-retention-pass]");
      if (runRet) {
        if (!requireRole("users")) return true;
        apiJson("POST","/admin/privacy/retention-run")
          .then((res) => { showToast(res.message || "Data retention cleanup executed."); refreshAll(); })
          .catch((err) => { showToast(err.message); });
        return true;
      }
      const reset = target.closest("[data-reset-demo]");
      if (reset) {
        if (!requireRole("users")) return true;
        if (reset.dataset.confirmed !== "yes") {
          reset.dataset.confirmed = "yes";
          reset.textContent = "Click again to reset all sample data";
          setTimeout(() => { if (reset.isConnected) { reset.dataset.confirmed = ""; reset.textContent = "Reset sample data"; } },6000);
        } else {
          reset.dataset.confirmed = ""; reset.textContent = "Reset sample data";
          mutate(apiJson("POST","/admin/reset-demo"),"The original sample dataset has been restored. User accounts were kept.",() => { ui.selectedCrisis = "C-MUM"; ui.selectedResource = null; ui.simulation = null; });
        }
        return true;
      }
      const sendOtp = target.closest("[data-send-phone-otp]");
      if (sendOtp) {
        apiJson("POST","/me/phone/send-otp").then((res) => {
          showToast(res.message || "Verification code sent.");
          if (res.otp) {
            const input = $("#phoneOtpInput");
            if (input) input.value = res.otp;
            showToast(`Verification code sent (Test OTP: ${res.otp})`);
          }
        }).catch((err) => {
          showToast(err.message || "Failed to send verification code.");
        });
        return true;
      }
      const verifyOtp = target.closest("[data-verify-phone-otp]");
      if (verifyOtp) {
        const input = $("#phoneOtpInput");
        const code = (input ? input.value : "").trim();
        if (!code || code.length !== 6) {
          showToast("Enter the 6-digit verification code.");
          return true;
        }
        apiJson("POST","/me/phone/verify-otp",{ code }).then(async (res) => {
          showToast(res.message || "Phone verified successfully!");
          if (db.me) db.me.phoneVerified = true;
          if (session && session.user) session.user.phoneVerified = true;
          await refreshAll();
        }).catch((err) => {
          showToast(err.message || "Verification failed. Check the code.");
        });
        return true;
      }
      if (target.closest("[data-refresh-my-outbox]")) {
        loadMyOutbox().then(() => renderWorkspace("collaboration"));
        return true;
      }
      if (target.closest("[data-refresh-admin-outbox]")) {
        loadAdminOutbox().then(() => renderWorkspace("users"));
        return true;
      }
      if (target.closest("[data-download-my-data]")) { downloadMyData(); return true; }
      if (target.closest("[data-open-delete-account]")) { openDeleteAccountModal(); return true; }
      if (target.closest("[data-close-delete-modal]")) { closeDeleteAccountModal(); return true; }
      if (target.closest("[data-open-privacy]")) { openPrivacyModal(); return true; }
      if (target.closest("[data-close-privacy-modal]")) { closePrivacyModal(); return true; }
      if (target === $("#deleteAccountModal")) { closeDeleteAccountModal(); return true; }
      if (target === $("#privacyModal")) { closePrivacyModal(); return true; }
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
      if (target.id === "demoRole" || target.id === "deskDemoRole") { switchDemoRole(target.value); return; }
      if (target.id === "crisisFilter") { ui.crisisFilter = target.value; renderWorkspace("crises"); return; }
      if (target.id === "resourceFilter") { ui.resourceFilter = target.value; renderWorkspace("resources"); return; }
      if (target.id === "messageChannel") { ui.channel = target.value; renderWorkspace("collaboration"); return; }
      if (target.id === "analyticsRange") { const days = Number(target.value); ui.analyticsDays = [7,30,60,90].includes(days) ? days : 30; db.analyticsError = null; renderWorkspace("analytics"); return; }
      if (target.id === "simulationPool") {
        const resource = resourceById(target.value);
        if (resource) { $("#simulationCapacity").value = available(resource); $("#simulationCost").value = resource.cost; }
        return;
      }
      if (target.dataset.crisisStatus) {
        if (!requireRole("crisis")) return;
        const crisis = crisisById(target.dataset.crisisStatus);
        if (!crisis || !["active","escalating","resolved"].includes(target.value) || target.value === crisis.status) return;
        mutate(apiJson("PATCH",`/crises/${enc(crisis.id)}`,{ status:target.value }),"Status and timeline updated. Resolving an incident releases its assignments.",null,true);
        return;
      }
      if (target.dataset.crisisSeverity || target.dataset.crisisCategory) {
        if (!requireRole("crisis")) return;
        const crisis = crisisById(target.dataset.crisisSeverity || target.dataset.crisisCategory);
        if (!crisis) return;
        let patch;
        if (target.dataset.crisisSeverity) {
          const severity = integer(target.value,1,5);
          if (severity === null) return;
          patch = { severity };
        } else {
          if (!["Flood","Fire","Medical","Landslide","Storm","Earthquake","Other"].includes(target.value)) return;
          patch = { category:target.value };
        }
        mutate(apiJson("PATCH",`/crises/${enc(crisis.id)}`,patch),"Incident classification updated. Priority recommendations use the latest severity.",null,true);
        return;
      }
      if (target.dataset.userRole) {
        if (!requireRole("users") || !roleNames[target.value]) return;
        mutate(apiJson("PATCH",`/users/${enc(target.dataset.userRole)}`,{ role:target.value }),"Role updated. Any open sessions for that person were ended so the new role applies at once.",null,true);
        return;
      }
      if (target.dataset.notificationPref) {
        const key = target.dataset.notificationPref;
        if (key === "sms" && !db.me?.phoneVerified && target.checked) {
          target.checked = false;
          showToast("Phone verification is required before enabling SMS notifications.");
          return;
        }
        if (["email","sms","push"].includes(key)) mutate(apiJson("PUT","/me/preferences",{ ...db.preferences,[key]:target.checked }),"Notification preference saved.",null,true);
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
        if (!get("title") || !get("city") || !get("region") || severity === null || population === null || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < 6 || lat > 37 || lng < 67 || lng > 98) { showToast("Provide a name, location, valid severity, and coordinates inside India (latitude 6 to 37, longitude 67 to 98)."); return; }
        mutate(apiJson("POST","/crises",{ title:get("title"),city:get("city"),region:get("region"),category:get("category"),severity,status:get("status") === "escalating" ? "escalating" : "active",population,lat,lng }),"Incident created and added to the shared picture.",(created) => { ui.selectedCrisis = created.id; });
      } else if (type === "resource") {
        if (!requireRole("resource")) return;
        const total = integer(get("total"),1), cost = integer(get("cost"),0,10000000);
        if (total === null || cost === null || !get("name") || !get("unit") || !get("organization") || !get("capability")) { showToast("Check the capacity, cost, type, organization, and capability fields."); return; }
        mutate(apiJson("POST","/resources",{ name:get("name"),type:get("type"),total,unit:get("unit"),cost,organization:get("organization"),capability:get("capability") }),"Resource pool added to the shared inventory.",(created) => { ui.selectedResource = created.id; });
      } else if (type === "patchResource") {
        if (!requireRole("resource")) return;
        const resId = form.dataset.resourceId;
        const total = integer(get("total"),1);
        if (!resId || total === null) { showToast("Enter a valid capacity number."); return; }
        mutate(apiJson("PATCH",`/resources/${enc(resId)}`,{ total }),"Resource capacity updated.");
      } else if (type === "stockMovement") {
        if (!requireRole("resource")) return;
        const resId = form.dataset.resourceId;
        const movementType = get("movementType");
        const quantity = integer(get("quantity"),1);
        const reason = get("reason");
        if (!resId || !["stock_in","stock_out"].includes(movementType) || quantity === null || !reason) {
          showToast("Select movement type, enter quantity and reason."); return;
        }
        mutate(apiJson("POST",`/resources/${enc(resId)}/stock-movement`,{ movementType, quantity, reason }),"Stock movement recorded.");
      } else if (type === "assign" || type === "override") {
        if (!requireRole(type === "override" ? "approve" : "allocate")) return;
        const quantity = integer(get("quantity"),1);
        if (!get("resourceId") || !get("crisisId") || quantity === null || !get("reason")) { showToast("Choose a pool and incident, and enter a quantity and a reason."); return; }
        mutate(apiJson("POST","/allocations",{ resourceId:get("resourceId"),crisisId:get("crisisId"),quantity,reason:get("reason").slice(0,250),override:type === "override" }),(result) => result.message);
      } else if (type === "request") {
        if (!requireRole("allocate")) return;
        const quantity = integer(get("quantity"),1);
        if (!get("resourceId") || !get("crisisId") || quantity === null) { showToast("Choose a valid resource and active crisis, and enter a positive quantity."); return; }
        mutate(apiJson("POST","/demands",{ resourceId:get("resourceId"),crisisId:get("crisisId"),quantity,reason:get("reason") }),"Request recorded. Resource pressure and recommendations have been recalculated.");
      } else if (type === "negotiation") {
        if (!requireRole("allocate")) return;
        if (!get("resourceId") || get("proposal").length < 5) return;
        mutate(apiJson("POST","/negotiations",{ resourceId:get("resourceId"),proposal:get("proposal").slice(0,350) }),"Proposal recorded for a manager or admin to review. No resources moved.");
      } else if (type === "user") {
        if (!requireRole("users") || !roleNames[get("role")]) return;
        if (!get("name") || !get("organization")) { showToast("Provide a name and organization."); return; }
        mutate(apiJson("POST","/users",{ name:get("name"),email:get("email"),organization:get("organization"),role:get("role") }),"Account created. Copy the temporary password below.",(result) => { ui.credential = { name:result.user.name,email:result.user.email,password:result.temporaryPassword }; });
      } else if (type === "password") {
        mutate(apiJson("POST","/auth/change-password",{ current:get("current"),new:values.get("next") }),"Password updated. Your other sessions were signed out.");
        form.reset();
      } else if (type === "message") {
        if (!requireRole("message") || get("text").length < 2) return;
        mutate(apiJson("POST","/messages",{ channel:ui.channel,text:get("text").slice(0,1200) }),"Message posted.");
      } else if (type === "attachment") {
        if (!requireRole("message")) return;
        const file = values.get("file");
        if (!(file instanceof File) || !file.size || file.size > 5*1024*1024 || !["pdf","csv","txt","json","png","jpg","jpeg"].includes(file.name.toLowerCase().split(".").pop())) { showToast("Choose a supported, non-empty document up to 5 MB."); return; }
        const payload = new FormData();
        payload.append("channel",ui.channel);
        payload.append("file",file);
        mutate(apiJson("POST","/attachments",payload),"Document attached to the thread.");
      } else if (type === "simulation") {
        const capacity = integer(get("capacity")), cost = integer(get("cost"),0,10000000), weight = integer(get("weight"),20,90);
        if (!get("resourceId") || capacity === null || cost === null || weight === null) { showToast("Check the scenario pool, capacity, cost, and priority weighting."); return; }
        apiJson("POST","/simulations/run",{ resourceId:get("resourceId"),capacity,cost,weight }).then((result) => {
          ui.simulation = result;
          $("#simulationResult").innerHTML = simulationResult(ui.simulation);
          showToast("Scenario calculated. No inventory or requests were changed.");
        }).catch((error) => { if (!error.handled) showToast(error.message); });
      }
    });
    listen(window,"storage",(event) => {
      if (event.key === appearanceKey && (event.newValue === "light" || event.newValue === "dark")) setTheme(event.newValue,false);
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
      if (target.closest("[data-intro-workspace]")) { finishIntro(); if (session) enterWorkspace(); return; }
      if (target.closest("[data-watch-intro]")) { startIntro(true); return; }
      if (target.closest("[data-theme-toggle]")) { event.preventDefault(); setTheme(currentTheme === "light" ? "dark" : "light"); return; }
      if (handleWorkspaceAction(event)) return;
      if (target === lit || target.closest("[data-close]")) { closeShot(); return; }
      if (target.closest("[data-close-panel]")) { closePanel(); return; }
      const panelTrigger = target.closest("[data-panel]");
      if (panelTrigger) {
        event.preventDefault();
        const view = panelTrigger.dataset.panel;
        if (moduleIds.includes(view)) { enterWorkspace(view); return; }
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
        const delM = $("#deleteAccountModal");
        if (delM && delM.classList.contains("is-open")) { closeDeleteAccountModal(); return; }
        const privM = $("#privacyModal");
        if (privM && privM.classList.contains("is-open")) { closePrivacyModal(); return; }
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

    // ---- Accounts, live updates and the role desks ----
    const STATUS_ORDER=["opened","verified","assigned","enroute","resolved"];
    const STATUS_LABEL={opened:"Opened",verified:"Verified",assigned:"Assigned",enroute:"En route",resolved:"Resolved"};
    const ROLE_ICONS={seeker:'<path d="M12 3.5 2.5 20h19L12 3.5Z"/><path d="M12 10v4.5M12 17.4h.01"/>',manager:'<path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12l1-8Z"/>',coordinator:'<path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4v-9Z"/><path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9"/>',admin:'<path d="M12 3 20 6v5.5c0 4.4-3 7.8-8 9.5-5-1.7-8-5.1-8-9.5V6l8-3Z"/>'};
    const ROLES={
      seeker:{label:"Help seeker",blurb:"Raise a help request and follow it from opened to resolved, like tracking a delivery.",tabs:["Raise a request","Track my requests"]},
      manager:{label:"Crisis manager",blurb:"Verify incoming requests and assign the right resource to each one.",tabs:["Incoming requests","Incident board"]},
      coordinator:{label:"Resource coordinator",blurb:"Hold the inventory, confirm dispatches, keep stock honest.",tabs:["Dispatch queue","Inventory"]},
      admin:{label:"Admin",blurb:"Full oversight of every request, resource and decision in the network.",tabs:["Overview","Audit trail"]},
    };
    const DESK_KEY={"help-seeker":"seeker","crisis-manager":"manager","resource-coordinator":"coordinator",admin:"admin"};
    const PLATFORM_ROLES=["admin","crisis-manager","resource-coordinator"];
    let session=null;               // { user, role } once the server has confirmed who is signed in
    let meta=null;                  // public server information (registration allowed? demo accounts?)
    let desk={ requests:[],resources:[],incidents:[],audit:[],revision:0 };
    const canUsePlatform=()=>Boolean(session&&PLATFORM_ROLES.includes(session.user.role));
    const hasDemoMode=()=>Boolean(meta&&meta.demo&&meta.demo.accounts&&meta.demo.accounts.length);
    const hasDesk=()=>Boolean(session&&session.role);
    function setSession(user){
      session=user?{user,role:DESK_KEY[user.role]||"seeker"}:null;
      ui.role=user?user.role:"help-seeker";
      syncAuthUI();
    }
    const authBtn=$("#authBtn");
    const I18N = {
      en: {
        lang_btn: "EN | हिंदी",
        signin_overline: "Sign in",
        signin_title: "Sign in to your workspace",
        signin_sub: "Use the e-mail and password for your ResQSync account. Your role decides which desk opens and what you can change.",
        register_title: "Create a help-seeker account",
        register_sub: "For people who need help. You can raise requests and follow them until they are resolved. Staff accounts are created by an administrator.",
        forgot_title: "Reset your password",
        forgot_sub: "Enter the e-mail address on your account. If registered, we will send reset instructions.",
        reset_title: "Choose a new password",
        reset_sub: "Enter the reset token sent to your email and select a new secure password.",
        signin_note: "Your account is stored on the ResQSync server. Sessions end when you sign out.",
        signin_btn: "Sign in",
        create_account_btn: "Create account",
        already_account: "I already have an account",
        need_help_account: "I need help: create an account",
        send_reset: "Send reset instructions",
        have_token: "I have a token",
        back_signin: "Back to sign in",
        set_new_pwd: "Set new password",
        email_label: "E-mail",
        password_label: "Password",
        name_label: "Full name",
        phone_label: "Phone (optional)",
        demo_accounts: "Demo accounts",
        forgot_password: "Forgot password?",
        direct_access: "Direct access",
        one_click: "One-click sign in",
        or_manual: "or enter credentials manually",
        email_chip: "Email",
        password_chip: "Password",
        privacy_notice: "Privacy Notice",
        show_password: "Show",
        hide_password: "Hide",
        demo_mode: "Demo mode",
        demo_mode_note: "Evaluation mode — one-click access is disabled in production.",
        demo_role: "Demo role",
        signed_in_as: "Signed in as",
        evaluation_only: "Evaluation only",
        desk_eyebrow: "ROLE WORKSPACE",
        seeker_title: "Help Seeker Desk",
        seeker_blurb: "Raise emergency requests for food, rescue, shelter, medical help, or evacuation. Responders coordinate immediately.",
        raise_tab: "Raise request",
        track_tab: "Track my requests",
        your_name: "Your name",
        phone_number: "Phone number",
        address: "Address",
        what_help: "What help do you need?",
        brief_placeholder: "Briefly describe the situation",
        adults_count: "Adults (approx.)",
        children_count: "Children (approx.)",
        photo_verification: "Photo for verification (optional, up to 2 MB)",
        raise_submit: "Raise request",
        emergency_notice: "Your request reaches crisis managers immediately. In a life-threatening emergency, call 112 first.",
        no_requests_yet: "No requests yet. Raise one from the first tab.",
        post_update: "Post update",
        cancel_req: "Cancel request",
        add_update_placeholder: "Add an update or note...",
        dup_warning_title: "Possible duplicate request:",
        dup_warning_desc: "Matches recent activity. Verify before dispatch."
      },
      hi: {
        lang_btn: "हिंदी | EN",
        signin_overline: "साइन इन",
        signin_title: "अपने कार्यक्षेत्र में साइन इन करें",
        signin_sub: "अपने ResQSync खाते के ईमेल और पासवर्ड का उपयोग करें। आपकी भूमिका तय करती है कि कौन सा डेस्क खुलेगा।",
        register_title: "सहायता-मांगने वाला खाता बनाएं",
        register_sub: "उन लोगों के लिए जिन्हें सहायता की आवश्यकता है। आप अनुरोध दर्ज कर सकते हैं और समाधान तक देख सकते हैं।",
        forgot_title: "पासवर्ड रीसेट करें",
        forgot_sub: "अपने खाते का ईमेल पता दर्ज करें। हम रीसेट निर्देश भेजेंगे।",
        reset_title: "नया पासवर्ड चुनें",
        reset_sub: "ईमेल पर प्राप्त रीसेट टोकन और नया सुरक्षित पासवर्ड दर्ज करें।",
        signin_note: "आपका खाता ResQSync सर्वर पर सुरक्षित है। साइन आउट करने पर सत्र समाप्त होता है।",
        signin_btn: "साइन इन करें",
        create_account_btn: "खाता बनाएं",
        already_account: "मेरे पास पहले से खाता है",
        need_help_account: "मुझे सहायता चाहिए: खाता बनाएं",
        send_reset: "रीसेट निर्देश भेजें",
        have_token: "मेरे पास टोकन है",
        back_signin: "साइन इन पर वापस जाएं",
        set_new_pwd: "नया पासवर्ड सेट करें",
        email_label: "ई-मेल",
        password_label: "पासवर्ड",
        name_label: "पूरा नाम",
        phone_label: "फ़ोन (वैकल्पिक)",
        demo_accounts: "त्वरित डेमो खाते",
        forgot_password: "पासवर्ड भूल गए?",
        direct_access: "सीधा प्रवेश",
        one_click: "एक क्लिक में साइन इन",
        or_manual: "या मैन्युअल रूप से क्रेडेंशियल दर्ज करें",
        email_chip: "ईमेल",
        password_chip: "पासवर्ड",
        privacy_notice: "गोपनीयता सूचना",
        show_password: "दिखाएँ",
        hide_password: "छिपाएँ",
        demo_mode: "डेमो मोड",
        demo_mode_note: "मूल्यांकन मोड — वन-क्लिक प्रवेश प्रोडक्शन में बंद रहता है।",
        demo_role: "डेमो भूमिका",
        signed_in_as: "साइन इन किया गया",
        evaluation_only: "केवल मूल्यांकन हेतु",
        desk_eyebrow: "भूमिका कार्यक्षेत्र",
        seeker_title: "सहायता अनुरोध डेस्क",
        seeker_blurb: "राहत, बचाव, भोजन या चिकित्सा सहायता के लिए आपातकालीन अनुरोध दर्ज करें। राहत दल तुरंत समन्वय करते हैं।",
        raise_tab: "सहायता मांगें",
        track_tab: "मेरे अनुरोध ट्रैक करें",
        your_name: "आपका नाम",
        phone_number: "फ़ोन नंबर",
        address: "पता (घर, गली, क्षेत्र, ज़िला)",
        what_help: "आपको किस प्रकार की सहायता चाहिए?",
        brief_placeholder: "स्थिति का संक्षेप में विवरण दें",
        adults_count: "वयस्क (लगभग)",
        children_count: "बच्चे (लगभग)",
        photo_verification: "सत्यापन हेतु फ़ोटो (वैकल्पिक, अधिकतम 2 MB)",
        raise_submit: "अनुरोध दर्ज करें",
        emergency_notice: "आपका अनुरोध तुरंत आपदा प्रबंधकों तक पहुँचता है। जीवन-घातक स्थिति में पहले 112 पर कॉल करें।",
        no_requests_yet: "अभी तक कोई अनुरोध नहीं है। पहले टैब से सहायता मांगें।",
        post_update: "अपडेट भेजें",
        cancel_req: "अनुरोध रद्द करें",
        add_update_placeholder: "कोई नई जानकारी या संदेश जोड़ें...",
        dup_warning_title: "संभावित डुप्लिकेट अनुरोध:",
        dup_warning_desc: "हाल ही में दर्ज अनुरोध से मेल खाता है। प्रेषण से पहले पुष्टि करें।"
      }
    };
    let currentLang = localStorage.getItem("resqsync_lang") || "en";
    const t = (k) => (I18N[currentLang] && I18N[currentLang][k]) || (I18N.en && I18N.en[k]) || k;
    function toggleLang() {
      currentLang = currentLang === "en" ? "hi" : "en";
      localStorage.setItem("resqsync_lang", currentLang);
      syncAuthUI();
      if (session && session.role === "seeker") renderRoleWorkspace();
      if (body.classList.contains("login-open")) renderLogin();
    }
    function trapFocus(container, event) {
      if (event.key !== "Tab") return;
      const focusables = Array.from(container.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")).filter((el) => !el.disabled && el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (event.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
    function syncAuthUI(){
      if(authBtn){ authBtn.textContent=session?ROLES[session.role].label:"Login"; authBtn.classList.toggle("is-authed",Boolean(session)); authBtn.title=session?`Signed in as ${session.user.name} — select to sign out`:"Sign in to your workspace"; }
      const menuAuth=$(".menu-secondary [data-auth]"); if(menuAuth) menuAuth.textContent=session?"Sign out":"Sign in";
      const chip=$("#wsRoleChip"); if(chip) chip.textContent=session?session.user.name:"";
      const deskBtn=$("#openDeskBtn"); if(deskBtn) deskBtn.hidden=!(session&&hasDesk()&&canUsePlatform());
      const platformBtn=$("#openPlatformBtn"); if(platformBtn) platformBtn.hidden=!canUsePlatform();
      $$("[data-lang-toggle]").forEach((b)=>{ b.textContent = currentLang === "hi" ? "हिंदी | EN" : "EN | हिंदी"; });
      syncDemoControls();
    }
    function syncDemoControls(){
      const demo=Boolean(session&&hasDemoMode());
      const main=$("#demoRole"), desk=$("#deskDemoRole");
      if(main){ main.disabled=!demo; if(session) main.value=session.user.role; main.setAttribute("aria-label",t(demo?"demo_role":"signed_in_as")); }
      if(desk){ desk.disabled=!demo; if(session) desk.value=session.user.role; desk.setAttribute("aria-label",t("demo_role")); }
      const label=$("#demoRoleLabel"); if(label) label.textContent=t(demo?"demo_role":"signed_in_as");
      const chip=$("#demoChip"); if(chip){ chip.hidden=!demo; chip.textContent=t("demo_mode"); }
      const deskChip=$("#deskDemoChip"); if(deskChip){ deskChip.hidden=!demo; deskChip.textContent=t("demo_mode"); }
      const wrap=$("#deskDemoRoleWrap"); if(wrap){ wrap.hidden=!demo; const span=wrap.querySelector("span"); if(span) span.textContent=t("demo_role"); }
    }
    async function switchDemoRole(role){
      if(!session||!hasDemoMode()||!role||role===session.user.role){ syncDemoControls(); return; }
      const main=$("#demoRole"), desk=$("#deskDemoRole");
      if(main) main.disabled=true;
      if(desk) desk.disabled=true;
      try{
        const data=await apiJson("POST","/auth/demo-login",{role});
        await startSession(data.user);
      }catch(err){
        showToast(err.message||"Could not switch demo role.");
      }finally{
        syncDemoControls();
      }
    }

    // ---- data loading ----
    async function loadDesk(){ desk=await apiJson("GET","/desk"); knownRevision=Math.max(knownRevision,desk.revision||0); }
    const platformVisible=()=>panelOpen&&panel.classList.contains("has-workspace");
    const deskVisible=()=>{ const view=$('[data-view="workspace"]'); return panelOpen&&view&&!view.hidden; };
    function renderVisible(){
      if(platformVisible()) renderWorkspace(ui.module);
      else if(deskVisible()) renderRoleWorkspace();
      syncAuthUI();
    }
    async function loadEverything(){
      const jobs=[loadDesk()];
      if(canUsePlatform()) jobs.push(loadWorkspace());
      await Promise.all(jobs);
    }
    async function refreshAll(){
      if(!session) return;
      await loadEverything();
      renderVisible();
    }

    // ---- live updates (Server-Sent Events) ----
    let eventSource=null, refreshTimer=0, pendingRender=false;
    function isEditing(){
      const root=platformVisible()?$("#workspaceContent"):$("#roleWorkspace");
      if(!root) return false;
      const active=document.activeElement;
      if(active&&root.contains(active)&&/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)&&active.type!=="checkbox") return true;
      return [...root.querySelectorAll("form input:not([type=checkbox]):not([type=hidden]), form textarea")].some((field)=>field.type==="file"?Boolean(field.files&&field.files.length):field.value!==field.defaultValue);
    }
    async function remoteRefresh(){
      if(!session) return;
      try{ await loadEverything(); }catch{ return; }
      if(isEditing()) pendingRender=true; else renderVisible();
    }
    listen(document,"focusout",()=>{
      if(!pendingRender) return;
      setTimeout(()=>{ if(pendingRender&&!isEditing()){ pendingRender=false; renderVisible(); } },200);
    });
    function connectEvents(){
      disconnectEvents();
      if(!session||typeof EventSource==="undefined") return;
      eventSource=new EventSource("/api/events");
      listen(eventSource,"change",(event)=>{
        let data={}; try{ data=JSON.parse(event.data); }catch{ /* refresh anyway */ }
        if(data.revision&&data.revision<=knownRevision) return;
        clearTimeout(refreshTimer);
        refreshTimer=setTimeout(remoteRefresh,250);
      });
      eventSource.onerror=()=>{
        if(eventSource&&eventSource.readyState===EventSource.CLOSED) apiJson("GET","/auth/me").catch((error)=>{ if(error.status===401) handleSessionLost(); });
      };
    }
    function disconnectEvents(){ clearTimeout(refreshTimer); if(eventSource){ eventSource.close(); eventSource=null; } }
    if (typeof onDispose === "function") onDispose(disconnectEvents); // React unmount: close the live-update stream

    // ---- sign in / out ----
    async function loadMeta(){ try{ meta=await apiJson("GET","/meta"); }catch{ meta=null; } }
    async function bootSession(){
      await loadMeta();
      try{
        const data=await apiJson("GET","/auth/me");
        setSession(data.user);
        await refreshAll();
        connectEvents();
      }catch{ setSession(null); }
    }
    async function startSession(user){
      setSession(user);
      knownRevision=0; db=emptyWorkspace();
      await refreshAll();
      connectEvents();
      closeLogin(false);
      enterWorkspace();
      showToast(`Signed in as ${user.name}.`);
    }
    function endSession(message){
      disconnectEvents();
      setSession(null);
      db=emptyWorkspace(); desk={ requests:[],resources:[],incidents:[],audit:[],revision:0 };
      knownRevision=0; ui.credential=null; ui.simulation=null;
      closePanel();
      if(message) showToast(message);
    }
    async function signOut(){
      try{ await api("POST","/auth/logout"); }catch{ /* the cookie is cleared locally either way */ }
      endSession("Signed out.");
    }
    function handleSessionLost(){
      if(!session) return;
      endSession("Your session has ended. Sign in again.");
      openLogin();
    }
    function enterWorkspace(moduleId="overview"){
      if(!session){ openLogin(); return; }
      if(canUsePlatform()) openPanel(moduleId); else openWorkspace();
    }
    function openWorkspace(){
      if(!session){ openLogin(); return; }
      if(!hasDesk()){ enterWorkspace(); return; }
      openPanel("workspace");
      renderRoleWorkspace();
    }

    // ---- login dialog ----
    let presetResetToken = "";
    function renderLogin(mode){
      const register=mode==="register";
      const forgot=mode==="forgot";
      const reset=mode==="reset";
      const overline = $("#login .overline");
      if(overline) overline.textContent = t("signin_overline");
      if(forgot){
        $("#loginTitle").textContent=t("forgot_title");
        $(".login-sub").textContent=t("forgot_sub");
      }else if(reset){
        $("#loginTitle").textContent=t("reset_title");
        $(".login-sub").textContent=t("reset_sub");
      }else{
        $("#loginTitle").textContent=register?t("register_title"):t("signin_title");
        $(".login-sub").textContent=register?t("register_sub"):t("signin_sub");
      }
      const canRegister=!meta||meta.allowRegistration;
      if(register){
        $("#roleGrid").innerHTML=`<form id="registerForm" class="work-form login-form" novalidate><label>${t("name_label")}<input class="work-input" name="name" required minlength="2" maxlength="80" autocomplete="name"></label><label>${t("email_label")}<input class="work-input" name="email" type="email" required maxlength="254" autocomplete="username"></label><label>${t("phone_label")}<input class="work-input" name="phone" type="tel" maxlength="30" autocomplete="tel"></label><label>${t("password_label")}<span class="password-wrap"><input class="work-input" name="password" type="password" required minlength="10" maxlength="128" autocomplete="new-password"><button type="button" class="password-toggle" data-toggle-password aria-label="${esc(t("show_password"))}" aria-pressed="false">${t("show_password")}</button></span></label><p class="login-hint">At least 10 characters, with letters and a number or symbol.</p><p class="login-error" id="loginError" role="alert" hidden></p><div class="form-actions"><button class="work-btn primary" type="submit">${t("create_account_btn")}</button><button class="work-btn" type="button" data-login-mode="signin">${t("already_account")}</button></div></form>`;
      }else if(forgot){
        $("#roleGrid").innerHTML=`<form id="forgotForm" class="work-form login-form" novalidate><label>${t("email_label")}<input class="work-input" name="email" type="email" required maxlength="254" autocomplete="username"></label><p class="login-error" id="loginError" role="alert" hidden></p><p class="login-hint" id="loginSuccess" style="color:var(--gold,#d4af37)" hidden></p><div class="form-actions"><button class="work-btn primary" type="submit">${t("send_reset")}</button><button class="work-btn" type="button" data-login-mode="reset">${t("have_token")}</button><button class="work-btn" type="button" data-login-mode="signin">${t("back_signin")}</button></div></form>`;
      }else if(reset){
        $("#roleGrid").innerHTML=`<form id="resetForm" class="work-form login-form" novalidate><label>Reset token<input class="work-input" name="token" required maxlength="128" placeholder="Paste token from email" value="${esc(presetResetToken||"")}"></label><label>${t("password_label")}<span class="password-wrap"><input class="work-input" name="password" type="password" required minlength="10" maxlength="128" autocomplete="new-password"><button type="button" class="password-toggle" data-toggle-password aria-label="${esc(t("show_password"))}" aria-pressed="false">${t("show_password")}</button></span></label><p class="login-hint">At least 10 characters, with letters and a number or symbol.</p><p class="login-error" id="loginError" role="alert" hidden></p><p class="login-hint" id="loginSuccess" style="color:var(--gold,#d4af37)" hidden></p><div class="form-actions"><button class="work-btn primary" type="submit">${t("set_new_pwd")}</button><button class="work-btn" type="button" data-login-mode="signin">${t("back_signin")}</button></div></form>`;
      }else{
        const baseRoles = [
          { role: "admin", name: "Crisis Director", tag: "Admin", email: "admin@resqsync.org", desc: "Full administrative oversight, audit logs & governance", can: "Manage users · Approve allocations", icon: '<path d="M12 3 20 6v5.5c0 4.4-3 7.8-8 9.5-5-1.7-8-5.1-8-9.5V6l8-3Z"/>' },
          { role: "crisis-manager", name: "Crisis Manager", tag: "Crisis Manager", email: "manager@resqsync.org", desc: "Incident verification, allocation conflict & emergency dispatch", can: "Create incidents · Verify requests", icon: '<path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12l1-8Z"/>' },
          { role: "resource-coordinator", name: "Resource Coordinator", tag: "Logistics", email: "coordinator@resqsync.org", desc: "Inventory management, dispatch tracking & logistics fleet", can: "Edit inventory · Dispatch units", icon: '<path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4v-9Z"/><path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9"/>' },
          { role: "help-seeker", name: "Citizen Seeker", tag: "Help Seeker", email: "citizen@resqsync.org", desc: "Raise emergency SOS relief requests & track responder arrival", can: "Raise requests · Track status", icon: '<path d="M12 3.5 2.5 20h19L12 3.5Z"/><path d="M12 10v4.5M12 17.4h.01"/>' }
        ];
        const serverAccounts = (meta && meta.demo && meta.demo.accounts) || [];
        const rolesToDisplay = baseRoles.map((br) => {
          const byEmail = serverAccounts.find((sa) => sa.email && sa.email.toLowerCase() === br.email.toLowerCase());
          const byRole = serverAccounts.find((sa) => sa.role === br.role);
          const found = byEmail || byRole;
          if (!found) return null;
          return { ...br, name: found.name || br.name, email: found.email || br.email };
        }).filter(Boolean);
        const quickRolesHtml = rolesToDisplay.length ? `
          <div class="role-section-title">${t("direct_access")} <span class="role-section-note">${t("one_click")} · ${t("demo_mode")} · ${t("evaluation_only")}</span></div>
          <div class="role-list" style="margin-bottom:14px">
            ${rolesToDisplay.map((r) => `
              <button type="button" class="role-card" data-direct-login data-role="${esc(r.role)}" aria-label="${esc(t("signin_btn"))}: ${esc(r.name)}" title="${esc(r.desc)}">
                <span class="role-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${r.icon}</svg></span>
                <div class="role-card-text">
                  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                    <b>${esc(r.name)}</b>
                    <span class="role-card-tag">${esc(r.tag)}</span>
                  </div>
                  <span class="role-card-can">${esc(r.can)}</span>
                  <div class="role-card-meta">
                    <span class="role-card-cred"><span>${esc(t("email_chip"))}</span>${esc(r.email)}</span>
                  </div>
                </div>
                <span class="role-arrow" aria-hidden="true">↗</span>
              </button>
            `).join("")}
          </div>
        ` : "";
        const divider = rolesToDisplay.length ? `<div class="login-divider">${t("or_manual")}</div>` : "";
        $("#roleGrid").innerHTML=`${quickRolesHtml}${divider}<form id="loginForm" class="work-form login-form" novalidate><label>${t("email_label")}<input class="work-input" name="email" type="email" required maxlength="254" autocomplete="username"></label><label>${t("password_label")}<span class="password-wrap"><input class="work-input" name="password" type="password" required maxlength="128" autocomplete="current-password"><button type="button" class="password-toggle" data-toggle-password aria-label="${esc(t("show_password"))}" aria-pressed="false">${t("show_password")}</button></span></label><div style="display:flex;justify-content:flex-end;margin-top:-4px;margin-bottom:8px"><button type="button" class="text-action" data-login-mode="forgot" style="font-size:12px">${t("forgot_password")}</button></div><p class="login-error" id="loginError" role="alert" hidden></p><div class="form-actions"><button class="work-btn primary" type="submit">${t("signin_btn")}</button>${canRegister?`<button class="work-btn" type="button" data-login-mode="register">${t("need_help_account")}</button>`:""}</div></form>`;
      }

      $(".login-note").textContent=t("signin_note")+(hasDemoMode()?" "+t("demo_mode_note"):"");
      const privacyBtn=$(".login-privacy"); if(privacyBtn) privacyBtn.textContent=t("privacy_notice");
    }
    async function openLogin(mode="signin"){
      if(introActive) finishIntro({restoreFocus:false});
      if(!meta) await loadMeta();
      const login=$("#login");
      renderLogin(mode);
      login.classList.add("is-open"); login.inert=false; login.setAttribute("aria-hidden","false");
      body.classList.add("login-open");
      requestAnimationFrame(()=>{ const first=$("#roleGrid input"); if(first) first.focus(); });
    }
    function closeLogin(focusBack=true){
      const login=$("#login"); if(!login.classList.contains("is-open")) return;
      login.classList.remove("is-open"); login.inert=true; login.setAttribute("aria-hidden","true");
      body.classList.remove("login-open");
      if(focusBack&&authBtn) authBtn.focus({preventScroll:true});
    }
    listen(document,"submit",async(event)=>{
      const form=event.target;
      if(form.id==="deleteAccountForm"){
        event.preventDefault();
        const pwdInput=$("#deleteAccountPassword");
        const confirmInput=$("#deleteAccountConfirm");
        const errBox=$("#delAccountError");
        const submitBtn=form.querySelector("[type=submit]");
        if(errBox){ errBox.hidden=true; errBox.textContent=""; }
        const pwd=(pwdInput?pwdInput.value:"").trim();
        if(!pwd){ if(errBox){ errBox.textContent="Please enter your password."; errBox.hidden=false; } return; }
        if(!confirmInput||!confirmInput.checked){ if(errBox){ errBox.textContent="Please check the confirmation box."; errBox.hidden=false; } return; }
        submitBtn.disabled=true;
        try{
          const res=await apiJson("POST","/me/delete-account",{password:pwd});
          closeDeleteAccountModal();
          endSession(res.message||"Your account and data have been erased.");
        }catch(err){
          if(errBox){ errBox.textContent=err.message||"Failed to delete account."; errBox.hidden=false; }
          submitBtn.disabled=false;
        }
        return;
      }
      if(form.id!=="loginForm"&&form.id!=="registerForm"&&form.id!=="forgotForm"&&form.id!=="resetForm") return;
      event.preventDefault();
      const failure=$("#loginError"), success=$("#loginSuccess"), submit=form.querySelector("[type=submit]"), values=new FormData(form), get=(key)=>String(values.get(key)||"").trim();
      if(failure) failure.hidden=true;
      if(success) success.hidden=true;
      if(!form.reportValidity()) return;
      submit.disabled=true;
      form.setAttribute("aria-busy","true");
      try{
        if(form.id==="loginForm"){
          const data=await apiJson("POST","/auth/login",{email:get("email"),password:String(values.get("password")||"")});
          await startSession(data.user);
        }else if(form.id==="registerForm"){
          const data=await apiJson("POST","/auth/register",{name:get("name"),email:get("email"),password:String(values.get("password")||""),...(get("phone")?{phone:get("phone")}:{})});
          await startSession(data.user);
        }else if(form.id==="forgotForm"){
          const res=await apiJson("POST","/auth/forgot",{email:get("email")});
          if(success){ success.textContent=res.message||"Reset instructions sent."; success.hidden=false; }
          submit.disabled=false;
        }else if(form.id==="resetForm"){
          const res=await apiJson("POST","/auth/reset",{token:get("token"),new_password:String(values.get("password")||"")});
          showToast(res.message||"Password reset. Please sign in.");
          renderLogin("signin");
        }
      }catch(error){
        if(failure){ failure.textContent=error.message; failure.hidden=false; }
        submit.disabled=false;
      }finally{
        form.removeAttribute("aria-busy");
      }
    });

    // ---- request desk ----
    function trackerHTML(req){
      const idx=STATUS_ORDER.indexOf(req.status);
      return `<div class="tracker"><ol>${STATUS_ORDER.map((s,i)=>{ const h=req.history[i]; return `<li class="${i<idx?"done":i===idx?"now":""}"><i>${i<idx?"✓":i+1}</i><span>${STATUS_LABEL[s]||s}</span>${h?`<small>${when(h.at)}</small>`:""}</li>`; }).join("")}</ol></div>`;
    }
    function requestCard(req,actions){
      const dupBadge = req.duplicateWarning ? `<div style="background:rgba(239,68,68,0.15);border:1px solid #ef4444;border-radius:4px;padding:6px 10px;margin-bottom:8px;font-size:12px;color:#fca5a5">⚠️ <b>${t('dup_warning_title')}</b> ${t('dup_warning_desc')} (${esc(req.duplicateCodes ? req.duplicateCodes.join(', ') : 'within 1 hr')})</div>` : "";
      return `<article class="req-card st-${req.status}"><div class="req-card-top"><span class="req-id">${esc(req.id)} · ${when(req.createdAt)}</span><span class="req-status ${req.status}">${STATUS_LABEL[req.status]||req.status}</span></div>
      ${dupBadge}
      <div class="req-meta"><span>${esc(req.name)}</span><span>${esc(req.address)}</span><span>${esc(req.phone)}</span><span>${req.adults} adults · ${req.children} children</span></div>
      <p class="req-brief">${esc(req.brief)}</p>
      ${req.photo?`<div class="photo-preview"><img src="${esc(req.photo)}" alt="Verification photo for ${esc(req.id)}"><small>Verification photo</small></div>`:""}
      ${req.resource?`<div class="req-meta"><span>Assigned: <b>${esc(req.resource)}</b></span></div>`:""}
      ${req.crisisTitle?`<div class="req-meta"><span>Incident: <b>${esc(req.crisisTitle)}</b></span></div>`:""}
      ${trackerHTML(req)}
      ${actions||""}</article>`;
    }
    const deskResourceOptions=()=>desk.resources.filter((r)=>!r.maintenance&&r.available>0).map((r)=>`<option value="${esc(r.id)}">${esc(r.name)} (${fmt(r.available)} free)</option>`).join("");
    const deskIncidentOptions=()=>`<option value="">No incident link</option>${desk.incidents.map((c)=>`<option value="${esc(c.id)}">${esc(c.city)} / ${esc(c.title)}</option>`).join("")}`;
    let lastDeskKey="";
    function renderRoleWorkspace(){
      if(!session||!hasDesk()) return;
      const role=ROLES[session.role];
      const isSeeker = session.role === "seeker";
      $("[data-role-eyebrow]").textContent = isSeeker ? t("desk_eyebrow") : "ROLE WORKSPACE";
      $("[data-role-title]").textContent = isSeeker ? t("seeker_title") : role.label;
      $("[data-role-blurb]").textContent = isSeeker ? t("seeker_blurb") : role.blurb;
      const roleIcon=$("#wsRoleIcon"); if(roleIcon) roleIcon.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ROLE_ICONS[session.role]}</svg>`;
      syncAuthUI();
      const tabs=$("#roleTabs");
      if(tabs.dataset.role!==session.role){ tabs.dataset.role=session.role; tabs.dataset.tab="0"; }
      const tabLabels = isSeeker ? [t("raise_tab"), t("track_tab")] : role.tabs;
      tabs.innerHTML=tabLabels.map((tText,i)=>`<button type="button" role="tab" aria-selected="${tabs.dataset.tab===String(i)}" class="${tabs.dataset.tab===String(i)?"is-active":""}" data-role-tab="${i}">${esc(tText)}</button>`).join("") + `<div style="margin-left:auto;display:flex;align-items:center"><a class="work-btn" href="/api/exports/help-requests.csv" download="help_requests.csv" style="text-decoration:none;font-size:11px;padding:3px 8px">Export CSV ↗</a></div>`;
      const wrap=$("#roleWorkspace"); const tab=Number(tabs.dataset.tab||0);
      const open=desk.requests.filter((r)=>r.status!=="resolved");
      if(session.role==="seeker"){
        if(tab===0){
          wrap.innerHTML=`<form class="work-form req-card" id="raiseForm">
            <div class="work-form-grid">
              <label>${t("your_name")}<input class="work-input" name="name" required maxlength="60" placeholder="${esc(session.user.name)}" value="${esc(session.user.name)}"></label>
              <label>${t("phone_number")}<input class="work-input" name="phone" type="tel" required minlength="5" maxlength="20" placeholder="+91 …" value="${esc(session.user.phone||"")}"></label>
              <label class="full">${t("address")}<input class="work-input" name="address" required maxlength="120" placeholder="House, street, town, district"></label>
              <label class="full">${t("what_help")}<textarea class="work-input" name="brief" required minlength="3" maxlength="240" rows="2" placeholder="${t("brief_placeholder")}"></textarea></label>
              <label>${t("adults_count")}<input class="work-input" name="adults" type="number" min="0" max="500" value="1" required></label>
              <label>${t("children_count")}<input class="work-input" name="children" type="number" min="0" max="500" value="0" required></label>
              <label class="full">${t("photo_verification")}<input class="work-input" id="raisePhoto" type="file" accept="image/jpeg,image/png,image/webp,image/gif"></label>
            </div>
            <div class="photo-preview" id="photoPreview" hidden><img alt="Verification photo preview"><small>Attached for verification</small></div>
            <div class="req-actions"><button class="work-btn primary" type="submit">${t("raise_submit")}</button><p style="color:var(--dim);font-size:11px">${t("emergency_notice")}</p></div>
          </form>`;
        } else {
          const privacyCard = `<div class="req-card" style="margin-top:20px;padding:14px 16px;background:var(--surface);border:1px solid var(--line-soft);border-radius:6px"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px"><div><b style="font-size:13px;color:var(--ink)">Privacy &amp; Data Erasure</b><p style="margin:4px 0 0;font-size:11px;color:var(--dim)">You can download your personal data copy or permanently delete your account &amp; requests.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="work-btn" data-download-my-data style="font-size:11px;padding:4px 10px">Download my data (JSON) 📥</button><button type="button" class="work-btn" data-open-delete-account style="font-size:11px;padding:4px 10px;color:#fca5a5;border-color:rgba(239,68,68,0.4)">Delete my account 🗑</button><button type="button" class="work-btn" data-open-privacy style="font-size:11px;padding:4px 10px">Privacy Notice 📜</button></div></div></div>`;
          const reqList = desk.requests.length?desk.requests.map((r)=>{
            let actions="";
            if(r.status!=="resolved"&&r.status!=="cancelled"){
              actions=`<div class="req-actions" style="margin-top:10px;padding-top:10px;border-top:1px solid var(--line-soft)">
                <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
                  <input class="work-input" name="updateText" placeholder="${t("add_update_placeholder")}" maxlength="250" style="flex:1;min-width:180px;font-size:12px">
                  <button class="work-btn" type="button" data-act="seeker-update" data-id="${esc(r.id)}">${t("post_update")}</button>
                  <button class="work-btn" type="button" data-act="seeker-cancel" data-id="${esc(r.id)}" style="color:#fca5a5">${t("cancel_req")}</button>
                </div>
              </div>`;
            }
            return requestCard(r,actions);
          }).join(""):`<p class="work-empty">${t("no_requests_yet")}</p>`;
          wrap.innerHTML = reqList + privacyCard;
        }
      } else if(session.role==="manager"){
        if(tab===0){
          wrap.innerHTML=open.length?open.map((r)=>{
            let actions="";
            if(r.status==="opened") actions=`<div class="req-actions"><select class="work-select" name="incident" aria-label="Link to an incident (optional)" style="max-width:260px">${deskIncidentOptions()}</select><button class="work-btn primary" type="button" data-act="verify" data-id="${esc(r.id)}">Verify request</button></div>`;
            else if(r.status==="verified") actions=`<div class="req-actions"><select class="work-select" name="resource" aria-label="Resource to assign" style="max-width:260px">${deskResourceOptions()||'<option value="">No capacity available</option>'}</select><button class="work-btn primary" type="button" data-act="assign" data-id="${esc(r.id)}">Assign resource</button></div>`;
            else if(r.status==="enroute"||r.status==="assigned") actions=`<div class="req-actions" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
              ${r.status==="enroute"?'<button class="work-btn primary" type="button" data-act="resolve" data-id="'+esc(r.id)+'">Mark resolved</button>':'<span style="color:var(--dim);font-size:11px">Waiting for dispatch · </span>'}
              <select class="work-select" name="reassignResource" aria-label="Reassign resource" style="max-width:180px">${deskResourceOptions()||'<option value="">No capacity</option>'}</select>
              <button class="work-btn" type="button" data-act="reassign" data-id="${esc(r.id)}">Reassign</button>
              <button class="work-btn" type="button" data-act="release-unit" data-id="${esc(r.id)}" style="color:#fca5a5">Release unit</button>
            </div>`;
            return requestCard(r,actions);
          }).join(""):'<p class="work-empty">No open requests right now.</p>';
        } else {
          wrap.innerHTML=`<div class="overview-stats">${[[""+open.length,"Open requests"],[""+desk.requests.filter((r)=>r.status==="enroute").length,"En route"],[""+desk.resources.reduce((s,r)=>s+r.assigned,0),"Units committed"],[""+desk.incidents.length,"Open incidents"]].map(([v,l])=>`<div class="overview-stat"><b>${v}</b><span>${l}</span></div>`).join("")}</div>`+open.map((r)=>requestCard(r)).join("");
        }
      } else if(session.role==="coordinator"){
        if(tab===0){
          const queue=desk.requests.filter((r)=>r.status==="assigned");
          wrap.innerHTML=queue.length?queue.map((r)=>requestCard(r,`<div class="req-actions"><button class="work-btn primary" type="button" data-act="dispatch" data-id="${esc(r.id)}">Confirm dispatch</button></div>`)).join(""):'<p class="work-empty">Nothing waiting for dispatch. Assigned requests appear here.</p>';
        } else {
          wrap.innerHTML=`<div class="table-scroll"><table class="work-table"><thead><tr><th>Resource</th><th>Type</th><th>Committed</th><th>Available</th></tr></thead><tbody>${desk.resources.map((r)=>`<tr><td><b>${esc(r.name)}</b>${r.maintenance?"<small>In maintenance</small>":""}</td><td>${esc(r.type)}</td><td>${fmt(r.assigned)} / ${fmt(r.total)}</td><td><div class="capacity-bar" style="min-width:90px"><i style="width:${Math.round(r.assigned/r.total*100)}%"></i></div></td></tr>`).join("")}</tbody></table></div>`;
        }
      } else if(session.role==="admin"){
        if(tab===0){
          wrap.innerHTML=`<div class="overview-stats">${[[""+desk.requests.length,"Total requests"],[""+open.length,"Open"],[""+desk.resources.reduce((s,r)=>s+(r.maintenance?0:r.available),0),"Units free"],[""+desk.audit.length,"Audit entries"]].map(([v,l])=>`<div class="overview-stat"><b>${v}</b><span>${l}</span></div>`).join("")}</div><h3 class="section-title">Latest decisions</h3><ul class="decision-list">${desk.audit.slice(0,8).map((a)=>`<li><small>${when(a.at)} · ${esc(a.actor)}</small>${esc(a.action)}</li>`).join("")}</ul>`;
        } else {
          wrap.innerHTML=`<ul class="decision-list">${desk.audit.map((a)=>`<li><small>${when(a.at)} · ${esc(a.actor)}</small>${esc(a.action)}</li>`).join("")}</ul>`;
        }
      }
      const deskKey=`${session.role}:${tab}`;
      if(deskKey!==lastDeskKey){
        lastDeskKey=deskKey;
        $$("#roleWorkspace > *").forEach((el,i)=>{ el.style.animation=`riseIn .55s var(--ease) ${Math.min(i,8)*60}ms backwards`; });
      }
    }
    let pendingPhoto=null;
    listen($("#roleTabs"),"click",(e)=>{ const b=e.target.closest("[data-role-tab]"); if(!b) return; $("#roleTabs").dataset.tab=b.dataset.roleTab; renderRoleWorkspace(); });
    listen($("#roleWorkspace"),"change",(e)=>{
      if(e.target.id!=="raisePhoto") return;
      const file=e.target.files&&e.target.files[0]; const prev=$("#photoPreview");
      if(!file||!/^image\/(jpeg|png|webp|gif)$/.test(file.type)){ if(file) showToast("Choose a JPEG, PNG, WebP or GIF photo."); e.target.value=""; if(prev) prev.hidden=true; pendingPhoto=null; return; }
      if(file.size>2*1024*1024){ showToast("That photo is larger than 2 MB. Choose a smaller one."); e.target.value=""; if(prev) prev.hidden=true; pendingPhoto=null; return; }
      const reader=new FileReader();
      reader.onload=()=>{ pendingPhoto=String(reader.result); const img=prev?prev.querySelector("img"):null; if(img) img.src=pendingPhoto; if(prev) prev.hidden=false; };
      reader.readAsDataURL(file);
    });
    listen($("#roleWorkspace"),"submit",(e)=>{
      if(e.target.id!=="raiseForm") return; e.preventDefault();
      const form=e.target, submit=form.querySelector("[type=submit]"), values=new FormData(form), get=(key)=>String(values.get(key)||"").trim();
      if(!form.reportValidity()) return;
      submit.disabled=true;
      const payload={name:get("name"),phone:get("phone"),address:get("address"),brief:get("brief"),adults:Number(get("adults"))||0,children:Number(get("children"))||0,...(pendingPhoto?{photo:pendingPhoto}:{})};
      mutate(apiJson("POST","/help-requests",payload),(created)=>`${created.id} raised. Track it under "Track my requests".`,()=>{ pendingPhoto=null; $("#roleTabs").dataset.tab="1"; }).then((created)=>{ if(created===null) submit.disabled=false; });
    });
    listen($("#roleWorkspace"),"click",(e)=>{
      const btn=e.target.closest("[data-act]"); if(!btn||!session) return;
      const id=btn.dataset.id, act=btn.dataset.act, scope=btn.closest(".req-actions");
      let request;
      if(act==="verify"){ const incident=scope&&scope.querySelector("select[name=incident]"); request=apiJson("POST",`/help-requests/${enc(id)}/verify`,incident&&incident.value?{crisisId:incident.value}:{}); }
      else if(act==="assign"){ const choice=scope&&scope.querySelector("select[name=resource]"); if(!choice||!choice.value){ showToast("No available capacity in that pool."); return; } request=apiJson("POST",`/help-requests/${enc(id)}/assign`,{resourceId:choice.value}); }
      else if(act==="dispatch") request=apiJson("POST",`/help-requests/${enc(id)}/dispatch`);
      else if(act==="resolve") request=apiJson("POST",`/help-requests/${enc(id)}/resolve`);
      else if(act==="seeker-update"){
        const input=scope&&scope.querySelector("input[name=updateText]");
        if(!input||!input.value.trim()){ showToast("Enter an update note."); return; }
        request=apiJson("POST",`/help-requests/${enc(id)}/update`,{text:input.value.trim()});
      }
      else if(act==="seeker-cancel"){
        request=apiJson("POST",`/help-requests/${enc(id)}/cancel`,{reason:"Cancelled by user"});
      }
      else if(act==="reassign"){
        const choice=scope&&scope.querySelector("select[name=reassignResource]");
        if(!choice||!choice.value){ showToast("Select a resource to reassign."); return; }
        request=apiJson("POST",`/help-requests/${enc(id)}/reassign`,{resourceId:choice.value});
      }
      else if(act==="release-unit"){
        request=apiJson("POST",`/help-requests/${enc(id)}/release-unit`);
      }
      else return;
      btn.disabled=true;
      mutate(request,(updated)=>`${updated.id} updated.`).then((updated)=>{ if(updated===null) btn.disabled=false; });
    });
    listen(document,"click",(e)=>{
      if(e.target.closest("[data-download-my-data]")){ e.preventDefault(); downloadMyData(); return; }
      if(e.target.closest("[data-open-delete-account]")){ e.preventDefault(); openDeleteAccountModal(); return; }
      if(e.target.closest("[data-close-delete-modal]")){ e.preventDefault(); closeDeleteAccountModal(); return; }
      if(e.target.closest("[data-open-privacy]")){ e.preventDefault(); openPrivacyModal(); return; }
      if(e.target.closest("[data-close-privacy-modal]")){ e.preventDefault(); closePrivacyModal(); return; }
      if(e.target === $("#deleteAccountModal")){ closeDeleteAccountModal(); return; }
      if(e.target === $("#privacyModal")){ closePrivacyModal(); return; }
      if(e.target.closest("[data-lang-toggle]")){ e.preventDefault(); toggleLang(); return; }
      const pwToggle=e.target.closest("[data-toggle-password]");
      if(pwToggle){
        e.preventDefault();
        const input=pwToggle.parentElement.querySelector("input");
        if(input){
          const show=input.type==="password";
          input.type=show?"text":"password";
          pwToggle.textContent=t(show?"hide_password":"show_password");
          pwToggle.setAttribute("aria-label",t(show?"hide_password":"show_password"));
          pwToggle.setAttribute("aria-pressed",String(show));
          input.focus({preventScroll:true});
        }
        return;
      }
      const mode=e.target.closest("[data-login-mode]");
      if(mode){ renderLogin(mode.dataset.loginMode); const first=$("#roleGrid input"); if(first) first.focus(); return; }
      const directLoginBtn=e.target.closest("[data-direct-login]");
      if(directLoginBtn){
        e.preventDefault();
        const role=directLoginBtn.dataset.role;
        const failure=$("#loginError");
        if(failure) failure.hidden=true;
        const cards=Array.from(document.querySelectorAll("[data-direct-login]"));
        cards.forEach((card)=>{ card.classList.add("is-loading"); card.setAttribute("aria-busy","true"); });
        apiJson("POST","/auth/demo-login",{role})
          .then((data)=>startSession(data.user))
          .catch((err)=>{
            if(failure){ failure.textContent=err.message||"Login failed."; failure.hidden=false; }
            cards.forEach((card)=>{ card.classList.remove("is-loading"); card.removeAttribute("aria-busy"); });
          });
        return;
      }
      const demoAccount=e.target.closest("[data-demo-email]");
      if(demoAccount){
        const form=$("#loginForm");
        if(form){
          form.email.value=demoAccount.dataset.demoEmail;
          form.password.value=demoAccount.dataset.demoPassword;
          const submit=form.querySelector("[type=submit]");
          if(submit) submit.click();
        }
        return;
      }
      if(e.target.closest("[data-login-close]")){ e.preventDefault(); closeLogin(); return; }
      if(e.target.closest("[data-open-desk]")){ e.preventDefault(); openWorkspace(); return; }
      if(e.target.closest("[data-open-platform]")){ e.preventDefault(); enterWorkspace(); return; }
      if(e.target.closest("[data-switch-role]")){ e.preventDefault(); signOut().then(()=>openLogin()); return; }
      if(e.target.closest("[data-auth]")){ e.preventDefault(); if(session) signOut(); else openLogin(); return; }
    });
    listen(document,"keydown",(e)=>{
      const delModal=$("#deleteAccountModal");
      const privModal=$("#privacyModal");
      if(delModal&&delModal.classList.contains("is-open")){
        if(e.key==="Escape"){ closeDeleteAccountModal(); return; }
        trapFocus(delModal,e);
        return;
      }
      if(privModal&&privModal.classList.contains("is-open")){
        if(e.key==="Escape"){ closePrivacyModal(); return; }
        trapFocus(privModal,e);
        return;
      }
      if(body.classList.contains("login-open")){
        if(e.key==="Escape"){ closeLogin(); return; }
        trapFocus($("#login"),e);
      }
    });
    syncAuthUI();
    bootSession();
    try{
      const qp=new URLSearchParams(window.location.search);
      const rt=qp.get("reset_token");
      if(rt){ presetResetToken=rt; openLogin("reset"); }
    }catch(_){}
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
