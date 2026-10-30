// Edit this file each week. No prices on purpose.
// Oct 29 evening: rebuilt from the actual Aldi receipt (Store #29, 63 items).
window.FOOD = {
  textTo: "+12162604338",
  week: "Week of Oct 29, built from what we actually bought",
  store: "Aldi",
  note: "Hi Gabe! The shopping's done, and this plan now matches exactly what came home from Aldi. There's a set menu for each day, your work lunches, and a short top-up list for the few things we didn't get. Nothing to approve and nothing to do. Just tell me if there's anything else you need.",
  meals: [
    {icon:"1️⃣", name:"Day 1 (both of you)", what:"<b>Breakfast:</b> Gabe has 3 eggs, bacon and an everything bagel. Owen has a Greek yogurt cup and a banana.<br><b>Lunch:</b> Gabe has a tuna sandwich (2 pouches, mayo, wheat bread, a cheese slice) with lime chips. Owen has a spinach wrap with hummus, a cheese slice and baby carrots.<br><b>Dinner:</b> Gabe has a ground turkey bowl (1 turkey tub, black beans, broccoli florets). Owen has a chicken burrito with broccoli."},
    {icon:"2️⃣", name:"Day 2 (both of you)", what:"<b>Breakfast:</b> Shredded wheat or Monsters cereal with milk, plus a banana.<br><b>Lunch:</b> Gabe has a turkey bowl from the second tub. Owen has a Hot Pocket and an apple.<br><b>Dinner:</b> Gabe has the meat lover pizza. Owen has the deluxe mac and cheese with the rest of the broccoli.<br><b>Dessert:</b> Share the cheesecake sampler."},
    {icon:"3️⃣", name:"Day 3 (Owen on his own)", what:"<b>Breakfast:</b> A breakfast pita and a Greek yogurt cup.<br><b>Lunch:</b> A hummus wrap with baby carrots.<br><b>Dinner:</b> Chicken burritos.<br><b>Snacks:</b> An apple, organic yogurt or a sweet bagel."},
    {icon:"4️⃣", name:"Day 4 (Owen on his own)", what:"<b>Breakfast:</b> Hash brown patties and a breakfast pita.<br><b>Lunch:</b> A Hot Pocket with an apple.<br><b>Dinner:</b> A black bean and cheese wrap, or chicken ramen with an egg.<br><b>Snacks:</b> A Greek yogurt cup or the Halloween snacks."},
    {icon:"🧳", name:"Gabe's work lunches (3)", what:"Pack the night before: a tuna sandwich (2 pouches with mayo on wheat bread, plus a pepper jack or cheddar slice), an apple or banana, and a handful of baby carrots. No cooking."},
    {icon:"🏋️", name:"Gabe's bulking extras", what:"3 dozen eggs, about 5 lb of ground turkey (two tubs plus the big 85/15 pack), bacon, whole milk Greek yogurt and whole milk. Spicy ramen with 2 eggs and turkey makes an easy extra meal."},
    {icon:"🥚", name:"Use first", what:"Ground turkey (cook the big 85/15 pack within 2 days or freeze it), bananas and broccoli florets. Then the eggs and yogurt."}
  ],
  groups: [
    {name:"Bought for Gabe", icon:"💪", items:[
      {n:"Large eggs, 3 dozen"},
      {n:"85/15 ground turkey, 1 big pack"},
      {n:"Ground turkey tubs, 2 (1 lb each)"},
      {n:"Premium bacon, 1 pack"},
      {n:"Pouch tuna, 4"},
      {n:"Mayonnaise, 1 jar"},
      {n:"Sausage and meat lover pizza, 1"},
      {n:"Chicken sausage, 1 pack"},
      {n:"Sliced sharp cheddar, 1 pack"},
      {n:"Pepper jack slices, 1 pack"},
      {n:"Spicy ramen, 2"},
      {n:"Whole milk Greek yogurt 4-packs, 3"},
      {n:"Everything bagels, 1 pack"}
    ]},
    {name:"Bought for Owen", icon:"🌱", items:[
      {n:"Assorted hummus, 1"},
      {n:"Spinach tomato wraps, 1 pack"},
      {n:"Chicken burritos, 1 pack"},
      {n:"Pepperoni Hot Pockets, 2 boxes (4 each)"},
      {n:"Breakfast pitas, 1 box"},
      {n:"Hash brown patties, 1 box"},
      {n:"Deluxe mac and cheese, 1"},
      {n:"Chicken ramen, 1 pack"},
      {n:"Raspberry and cherry Greek yogurt 4-pack, 1"},
      {n:"Indulgent Greek yogurt, 1"},
      {n:"Organic whole milk yogurts, 1"},
      {n:"Sweet bagels, 1 pack"},
      {n:"Summit Waves energy drinks, 2"}
    ]},
    {name:"Shared", icon:"🧺", items:[
      {n:"Whole milk, 1 gallon"},
      {n:"Almondmilk creamer, 1"},
      {n:"100% wheat bread, 1 loaf"},
      {n:"Deli cheese slices, 2 packs"},
      {n:"Black beans, 2 cans"},
      {n:"Frosted shredded wheat, 1 box"},
      {n:"Monsters cereal, 1 box"},
      {n:"Ketchup, 38 oz"},
      {n:"Hint of lime chips, 1 bag"},
      {n:"Coconut water, 1 liter"},
      {n:"Cheesecake sampler, 1"},
      {n:"Annie's Halloween snacks, 1"},
      {n:"Honey or cranberry dip, 1"}
    ]},
    {name:"Produce", icon:"🥕", items:[
      {n:"Bananas, about 2 lb"},
      {n:"Pink Lady apples, 1 bag"},
      {n:"Baby carrots, 1 bag"},
      {n:"Broccoli florets, 1 bag"}
    ]},
    {name:"Still need (small top-up)", icon:"📝", items:[
      {n:"Ground coffee, 1 can (skip it if there's some at home)"},
      {n:"Milk, 1 more gallon, so Gabe has enough for the week"},
      {n:"Peanut butter, 1 jar"},
      {n:"Frozen mixed vegetables, 1 bag, since the broccoli runs out by Day 2"},
      {n:"Microwave rice cups, 1 pack, for the turkey bowls"},
      {n:"Snap peas, 1 bag (the store was out)"}
    ]}
  ],
  trips: [
    {icon:"✅", t:"The big Aldi trip is done", d:"Everything below the top-up list is already at home."},
    {icon:"🚶", t:"Quick top-up at Dollar General or Aldi", d:"Just the short 'Still need' list, whenever it's easy."}
  ]
};
