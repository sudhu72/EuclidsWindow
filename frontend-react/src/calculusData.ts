// Calculus Lab copy, extracted from the classic markup as Markdown so it
// renders through the app's existing Markdown component.

export type Level = "kids" | "teen" | "college" | "adult";
export const LEVELS: Level[] = ["kids", "teen", "college", "adult"];

export interface GameCopy {
  title: string;
  subtitle: string;
  prompt: string;
  levels: Record<string, string>;
}

export const COPY: Record<string, GameCopy> = {
  "slope": {
    "title": "Slope Explorer — Tangent Line & Derivative",
    "subtitle": "Drag the point along the curve to see the tangent line and instantaneous slope (derivative) change in real time.",
    "prompt": "What is a derivative and how does the tangent line relate to instantaneous rate of change?",
    "levels": {
      "kids": "Imagine rolling a ball on a hill. Where the hill is steep, the ball speeds up. Where it flattens, the ball slows down. The **derivative** tells you exactly how steep the hill is at every point — it is the “steepness number.” A steepness of 0 means the top of the hill (the ball pauses before rolling back down).",
      "teen": "The derivative f′(x) is the slope of the tangent line at x. For f(x) = x², the derivative is f′(x) = 2x. At x = 3 the slope is 6 — steep uphill. At x = 0 the slope is 0 — a flat turning point. The *secant line* through two points approaches the tangent as the gap h → 0. This limit IS the derivative: f′(x) = lim_h→0 [f(x+h)−f(x)] / h.",
      "college": "**Definition:** f′(a) = lim_h→0 [f(a+h)−f(a)]/h, provided the limit exists. Geometrically, this is the slope of the tangent to the graph at (a, f(a)). The tangent line y = f(a) + f′(a)(x−a) is the best linear approximation — the first-order Taylor polynomial. The secant slope [f(a+h)−f(a)]/h converges to f′(a) as h→0; the convergence rate is O(h) for differentiable functions, O(h²) when we use the symmetric difference quotient.",
      "adult": "In engineering and data science, the derivative is the instantaneous rate of change. For f(x) = x², f′(x) = 2x, meaning each unit increase in x produces roughly 2x additional units of f. This is the foundation of gradient descent: to minimize a loss L(θ), update θ &larr; θ − α&nabla;L(θ). The tangent line visualized here is exactly what the optimizer “sees” at each step — a linear approximation guiding the next move."
    }
  },
  "riemann": {
    "title": "Area Under a Curve — Riemann Sums",
    "subtitle": "See how thin rectangles approximate the area under a curve. Increase the number of rectangles and watch the sum converge to the true integral.",
    "prompt": "What is a Riemann sum and how does it converge to the definite integral?",
    "levels": {
      "kids": "Imagine you want to know the area of an oddly shaped swimming pool. You can’t use length × width because it’s curvy! Instead, fill the pool with thin rectangles. Count them up — that’s roughly the area. Use thinner rectangles? You get closer to the true answer. That’s what an **integral** does — it uses infinitely thin slices for the perfect answer.",
      "teen": "A Riemann sum splits [a,&thinsp;b] into n strips of width Δx = (b−a)/n. Each rectangle’s height is f(x_i^*). The sum ∑f(x_i^*)Δx approximates the area. As n → ∞, this converges to the definite integral ∫_a^bf(x)dx. The Fundamental Theorem of Calculus says ∫_a^bf(x)dx = F(b)−F(a), where F′ = f.",
      "college": "**Riemann Integral:** For a partition P of [a,b], the upper/lower Darboux sums satisfy L(P,f) ≤ ∫f ≤ U(P,f). f is Riemann integrable iff for every &epsilon;>0 there exists P with U−L < &epsilon;. Continuous functions on [a,b] are always integrable. Error bounds: left/right sums have error O(1/n), midpoint O(1/n²), Simpson’s O(1/n&sup4;).",
      "adult": "Numerical integration is ubiquitous: Monte Carlo integration for high-dimensional spaces (finance, physics), Gaussian quadrature for precise low-dimensional integrals, adaptive Simpson’s for general-purpose computation. The Riemann sum you see here is the conceptual foundation. In machine learning, the area under the ROC curve (AUC) is computed via the trapezoidal rule on discrete points. In engineering, total energy = ∫P(t)dt is computed from sampled power data."
    }
  },
  "optimize": {
    "title": "Optimization Playground",
    "subtitle": "Classic calculus word problems brought to life: adjust dimensions and see how the objective function changes. Find the maximum or minimum!",
    "prompt": "How do you use derivatives to solve optimization problems like maximizing area with a fixed perimeter?",
    "levels": {
      "kids": "Imagine you have a fixed length of rope and want to make the biggest possible pen for your pet. If you make it very long and skinny, the area is small. If you make it a square, the area is biggest! **Optimization** means finding the “just right” shape that gives the most (or least) of something.",
      "teen": "Optimization uses derivatives to find max/min values. For the fence problem: perimeter = 2x + 2y = 100, so y = 50−x. Area A = x(50−x) = 50x−x². Take the derivative: A′ = 50−2x. Set A′ = 0 &rArr; x = 25. Since A&Prime; = −2 < 0, this is a maximum. The optimal shape is a 25×25 square with area 625 m².",
      "college": "**Second Derivative Test:** If f′(c) = 0 and f&Prime;(c) < 0, then c is a local maximum; if f&Prime;(c) > 0, a local minimum. For the open-top box cut from a sheet of side s: V(x) = x(s−2x)². Setting V′(x) = 0 yields x = s/6 (the physically valid root). Lagrange multipliers generalize this to constrained optimization: &nabla;f = &lambda;&nabla;g at the optimum.",
      "adult": "These classic problems illustrate the core of operations research. The fence problem is a quadratic program with a linear constraint — always solvable in closed form. The box and can problems are nonlinear but single-variable after substitution. In industry, the same first-order condition f′(x) = 0 generalizes to gradient descent (&nabla;L = 0) for high-dimensional loss surfaces in ML, and to KKT conditions for constrained problems in logistics, finance, and engineering design."
    }
  },
  "diffeq": {
    "title": "Differential Equations Simulator",
    "subtitle": "Watch how populations, temperatures, and epidemics evolve over time. Adjust parameters and see the solution curves change.",
    "prompt": "How do differential equations model real-world phenomena like population growth and epidemics?",
    "levels": {
      "kids": "A differential equation is like a recipe for change. It says: “How fast something grows depends on how much you already have.” Rabbits make baby rabbits — the more rabbits, the more babies, so the population speeds up! But if foxes eat rabbits, both populations go up and down in waves. These “recipes for change” predict the future.",
      "teen": "**Exponential:** dy/dt = ky &rArr; y = y_0e^kt. Positive k = growth, negative = decay. **Logistic:** dy/dt = ky(1−y/K) caps growth at carrying capacity K. **Lotka-Volterra:** dx/dt = αx−βxy, dy/dt = δxy−γy (prey x, predator y) produce oscillating populations. **SIR:** dS/dt = −βSI, dI/dt = βSI−γI, dR/dt = γI models disease spread.",
      "college": "**Existence & Uniqueness (Picard-Lindel&ouml;f):** If f(t,y) is Lipschitz in y, then y′ = f(t,y), y(t_0) = y_0 has a unique local solution. The Lotka-Volterra system has a conserved quantity H(x,y) = δx − γln(x) + βy − αln(y), yielding closed orbits in the phase plane. The SIR threshold theorem: an epidemic occurs iff R_0 = βS(0)/γ > 1.",
      "adult": "These ODE models underpin epidemiology (SIR/SEIR for COVID forecasting), ecology (Lotka-Volterra for fishery management), pharmacokinetics (drug concentration decay), and financial modeling (Black-Scholes PDE). Numerical methods used here: 4th-order Runge-Kutta gives O(h&sup4;) local error. In production, adaptive step-size (Dormand-Prince / RK45) balances accuracy and computation. Stiff systems (e.g., chemical kinetics) require implicit methods like BDF."
    }
  },
  "projectile": {
    "title": "Projectile Lab — Calculus Meets Physics",
    "subtitle": "Launch a projectile and see position, velocity, and acceleration as functions of time. The derivative of position IS velocity; the derivative of velocity IS acceleration.",
    "prompt": "How does calculus describe projectile motion through derivatives and integrals?",
    "levels": {
      "kids": "When you throw a ball, gravity pulls it down. The harder you throw, the farther it goes. If you throw at 45°, you get the *maximum distance*! The ball’s speed changes every instant because gravity keeps pulling — that changing speed is what calculus measures.",
      "teen": "Position: x(t) = v_0cos(θ)t, y(t) = v_0sin(θ)t − &frac12;gt². Velocity is the derivative of position: v_y(t) = v_0sin(θ) − gt. Acceleration is the derivative of velocity: a_y = −g (constant). The max height occurs when v_y = 0, and the range is R = v_0²sin(2θ)/g, maximized at θ = 45°.",
      "college": "The equations of motion follow from Newton’s 2nd law F = ma with F = (0, −mg). Integrating a(t) = (0, −g) gives v(t) = (v_0cosθ, v_0sinθ − gt). Integrating again: r(t) = (v_0t cosθ, v_0t sinθ − gt²/2). Eliminating t yields the parabolic trajectory y = x tanθ − gx²/(2v_0²cos²θ). With drag F_d = −bv, the ODE has no closed-form solution and requires numerical integration.",
      "adult": "Projectile motion is the simplest ODE initial-value problem in mechanics: r&Prime;(t) = g. Adding air resistance (F_d = −&frac12;C_d&rho;A|v|v) makes it a nonlinear system requiring Runge-Kutta. In ballistics, the Magnus effect (spin) adds a lateral force. In sports analytics, launch angle optimization (e.g., baseball exit velocity at 25–30°, not 45°, due to drag) uses numerical solutions of these ODEs with measured C_d values."
    }
  },
  "orbital": {
    "title": "Orbital Mechanics — Calculus Powers Space Travel",
    "subtitle": "Launch a shuttle from Earth and navigate to the Moon or Mars using Hohmann transfer orbits. See how gravity, velocity, and calculus govern every manoeuvre.",
    "prompt": "How does calculus power orbital mechanics, Hohmann transfers, and space travel to the Moon and Mars?",
    "levels": {
      "kids": "To reach the Moon or Mars, a rocket doesn’t fly in a straight line — it rides a curved path called an **orbit**. Gravity keeps pulling the shuttle toward Earth like a ball on a string. To go farther out, the shuttle speeds up at just the right moment, stretching its path into an oval (*ellipse*) that reaches the Moon or Mars. Getting the speed exactly right is what calculus figures out!",
      "teen": "**Newton’s Law of Gravitation:** F = GMm/r² provides the acceleration a = GM/r² toward the central body. Orbital velocity at radius r is v = √(GM/r). A **Hohmann transfer** uses two burns: (1) speed up from circular orbit to enter an ellipse that just touches the target orbit, (2) speed up again at arrival to circularise. The Δv (velocity change) at each burn is computed from the vis-viva equation: v² = GM(2/r − 1/a), where a is the semi-major axis.",
      "college": "**Vis-viva equation:** v² = GM(2/r − 1/a), derived by integrating the gravitational potential energy dU = −GMm/r² dr and applying conservation of energy E = &frac12;mv² − GMm/r = −GMm/(2a). The Hohmann transfer minimises Δv between coplanar circular orbits. Transfer time = &frac12;√(4π²a_t³/(GM)), where a_t = (r_1+r_2)/2. This is Kepler’s Third Law applied to the transfer ellipse. The shuttle’s state evolves via the two-body ODE: **r**&Prime; = −GM**r**/|**r**|³.",
      "adult": "Real mission design extends the two-body problem with patched-conics (sphere of influence transitions), the restricted three-body problem (Lagrange points, halo orbits), and numerical trajectory optimisation. The Δv budget is the fundamental currency: Tsiolkovsky’s rocket equation Δv = v_e ln(m_0/m_f) links fuel mass to velocity change via the exhaust velocity v_e. NASA’s Artemis missions use a near-rectilinear halo orbit around the Moon; Mars transfers exploit launch windows when the Hohmann geometry aligns (every ~26 months). All of this is calculus: ODEs for trajectories, integrals for energy budgets, optimisation for minimal-fuel paths."
    }
  }
};
