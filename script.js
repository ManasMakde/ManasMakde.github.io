// Text typing
const typedTextSpan = document.querySelector(".typed-text");
const cursorSpan = document.querySelector(".cursor");

const textArray = ["// Hello there", "<!-- Hi -->", "/*  Greetings  */", "# Welcome", "-- Salutations"];
const typingDelay = 125;
const erasingDelay = 50;
const newTextDelay = 2000; // Delay between current and next text
let textArrayIndex = 0;
let charIndex = 0;

function type() {
  if (charIndex < textArray[textArrayIndex].length) {
    if (!cursorSpan.classList.contains("typing")) cursorSpan.classList.add("typing");
    typedTextSpan.textContent += textArray[textArrayIndex].charAt(charIndex);
    charIndex++;
    setTimeout(type, typingDelay);
  }
  else {
    cursorSpan.classList.remove("typing");
    setTimeout(erase, newTextDelay);
  }
}

function erase() {
  if (charIndex > 0) {
    if (!cursorSpan.classList.contains("typing")) cursorSpan.classList.add("typing");
    typedTextSpan.textContent = textArray[textArrayIndex].substring(0, charIndex - 1);
    charIndex--;
    setTimeout(erase, erasingDelay);
  }
  else {
    cursorSpan.classList.remove("typing");
    textArrayIndex++;
    if (textArrayIndex >= textArray.length) textArrayIndex = 0;
    setTimeout(type, typingDelay + 1100);
  }
}

document.addEventListener("DOMContentLoaded", function () { // On DOM Load initiate the effect
  if (textArray.length) setTimeout(type, newTextDelay + 250);
});

document.querySelectorAll(".skill_container").forEach((el) => {
  el.onclick = () => {
    el.classList.toggle("skill_open");
  }
});

document.querySelectorAll(".project_expand").forEach((el) => {
  el.onclick = () => {
    var prev = document.querySelector(".project_open")
    if (prev)
      prev.classList.remove("project_open")
    if (prev != el.parentElement)
      el.parentElement.classList.add("project_open")
  }
});

const project_fullscreen_wrapper = document.querySelector("#project_fullscreen_wrapper")
const proj_title = document.querySelector("#proj_title")
const proj_img = document.querySelector("#proj_screen img")
const proj_tools = document.querySelector("#proj_tools")
const proj_description = document.querySelector("#proj_description")
const proj_links = document.querySelector("#proj_links")

document.querySelectorAll(".project_heading").forEach((el) => {
  el.onclick = () => {

    let mapping = [
      ["innerText", proj_title, el.querySelector(".project_title")],
      ["src", proj_img, el.querySelector("img")],
      ["innerText", proj_tools, el.parentElement.querySelector(".p_tools")],
      ["innerText", proj_description, el.parentElement.querySelector(".p_description")],
      ["innerHTML", proj_links, el.parentElement.querySelector(".p_links")]
    ]

    for (i in mapping) {
      i = mapping[i]

      let attr = i[0]
      if (i[2])
        i[1][attr] = i[2][attr]
      else
        i[1][attr] = null
    }

    project_fullscreen_wrapper.classList.add("project_fullscreen_open")
  }
});

const close_fullscreen = () => {
  project_fullscreen_wrapper.classList.remove("project_fullscreen_open")
}
document.querySelector("#proj_close").onclick = close_fullscreen
project_fullscreen_wrapper.onclick = close_fullscreen
document.body.onresize = () => {
  close_fullscreen()
  toggle_options(false)

  options.classList.add("notransition");
  options.offsetHeight;
  options.classList.remove("notransition");

  height_calc();
}


// Hamburger
const hamburger = document.querySelector("#hamburger")
const options = document.querySelector(".options")
const option_dark = document.querySelector("#option_dark")
var opened = false
const toggle_options = (forced) => {
  if (forced != undefined)
    opened = forced
  else
    opened = !opened

  if (opened) {
    hamburger.classList.add("closedham")
    options.classList.add("options_open")
    option_dark.classList.add("option_dark_open")
  }
  else {
    hamburger.classList.remove("closedham")
    options.classList.remove("options_open")
    option_dark.classList.remove("option_dark_open")
  }
}
hamburger.onclick = () => { toggle_options() }

option_dark.onclick = () => { toggle_options(false) }


//Side bar
var old_index
let options_links=document.querySelectorAll(".options a");
let option_items_arr = document.querySelectorAll(".option_item");
let option_y_arr = []
let option_height_arr=[]
const height_calc = () => {

  option_y_arr = []
  option_height_arr=[]
  option_items_arr.forEach((el, index) => {
    option_y_arr.push(el.offsetTop)
    option_height_arr.push(el.offsetHeight + (index?option_height_arr[index-1]:0));
  });

};height_calc();

const set_option = () => {

  var new_index

  for(let i=0;i<option_y_arr.length;i++){
    if (document.documentElement.scrollTop < option_height_arr[i]){
      new_index = i
      break
    }
  }

  if (old_index != new_index) {
      if(old_index!=undefined)
        options_links[old_index].classList.remove("option_active")
      options_links[new_index].classList.add("option_active")
      old_index = new_index
    }
};set_option();

window.addEventListener('scroll', set_option);

function view_option_item(index) {
  toggle_options(false)
  window.scrollTo({
    top: option_y_arr[index] + 3,
    left: 0,
    behavior: "smooth"
  })
}

// Animations

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const observer = new IntersectionObserver((entries)=>{
  entries.forEach((el)=>{

    if (el.isIntersecting){
      el.target.classList.remove('animate_hidden')
      el.target.classList.add('animate_show')
    }
    // else
    //   el.target.classList.remove('animate_show')
  });
})

const hidden_elements = document.querySelectorAll('.animate_hidden');
hidden_elements.forEach((el)=>{
  if(isMobile)
    el.classList.remove("animate_hidden")
  else
    observer.observe(el)
});


// category transition delay
let duration=0.25;
document.querySelectorAll(".skill_category").forEach((el)=>{
    el.querySelectorAll(".skill_card").forEach((item,index)=>{
      item.style.transitionDelay=(duration * index) + "s"
    });
});


// disable animations if on mobile