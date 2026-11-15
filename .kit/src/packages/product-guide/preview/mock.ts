import {setIcon} from "../../pkm-task/preview/obsidian-mock.ts";
export {setIcon,Keymap,prepareFuzzySearch,MarkdownRenderer,parseYaml,Component} from "../../pkm-task/preview/obsidian-mock.ts";
export const Platform:any={isMobile:false,isPhone:false,isDesktopApp:true};
export function setTooltip(el:any,text:string){el.title=text}
const proto:any=HTMLElement.prototype;
for(const [name,fn] of Object.entries({
 empty(this:HTMLElement){this.replaceChildren()},
 addClass(this:HTMLElement,...cls:string[]){this.classList.add(...cls)},
 removeClass(this:HTMLElement,...cls:string[]){this.classList.remove(...cls)},
 toggleClass(this:HTMLElement,c:string,on:boolean){this.classList.toggle(c,on)},
 setText(this:HTMLElement,text:string){this.textContent=text},
 appendText(this:HTMLElement,text:string){this.append(document.createTextNode(text))},
 toggle(this:HTMLElement,on:boolean){this.style.display=on?"":"none"},
 createEl(this:HTMLElement,tag:string,o:any={}){const e=document.createElement(tag);if(o.text)e.textContent=o.text;if(o.cls)e.className=o.cls;if(o.href)e.setAttribute("href",o.href);for(const[k,v]of Object.entries(o.attr||{}))e.setAttribute(k,String(v));this.append(e);return e},
 createDiv(this:HTMLElement,o:any={}){return (this as any).createEl("div",o)},
 createSpan(this:HTMLElement,o:any={}){return (this as any).createEl("span",o)}
})) proto[name]=fn;
Object.assign(DocumentFragment.prototype,{createEl:proto.createEl});
export class Notice { constructor(text:any){const el=document.createElement("div");el.className="notice";el.append(typeof text==="string"?document.createTextNode(text):text);document.querySelector("#wide")?.append(el)} hide(){} }
export class TFile {path:string;basename:string;extension:string;stat={mtime:Date.now(),ctime:Date.now(),size:256};constructor(path=""){this.path=path;this.basename=path.split("/").pop()!.replace(/\.[^.]+$/,"");this.extension=path.split(".").pop()!} }
export class TFolder {}
export class Modal {
 scope={register(..._args:any[]){}};
 contentEl:any=document.createElement("div");modalEl:any=document.createElement("div");titleEl:any=document.createElement("h2");containerEl:any=this.modalEl;
 constructor(public app:any){this.modalEl.className="modal";this.contentEl.className="modal-content";this.modalEl.append(this.titleEl,this.contentEl)}
 setTitle(text:string){this.titleEl.textContent=text}
 open(){document.querySelector("#wide")!.append(this.modalEl);(this as any).onOpen?.()}
 close(){(this as any).onClose?.();this.modalEl.remove()}
}
export class SuggestModal extends Modal {
 emptyStateText="";placeholder="";
 setPlaceholder(t:string){this.placeholder=t} setInstructions(_v:any){}
 override open(){super.open();const input=this.contentEl.createEl("input",{attr:{placeholder:this.placeholder}});const list=this.contentEl.createDiv();const update=()=>{list.empty();const items=(this as any).getSuggestions(input.value);if(!items.length)list.setText(this.emptyStateText);for(const item of items)(this as any).renderSuggestion(item,list.createDiv({cls:"suggestion-item"}))};input.addEventListener("input",update);update()}
}
export class FuzzySuggestModal extends SuggestModal {}
export class Plugin {
 commands:any[]=[];constructor(public app:any){}
 addCommand(c:any){this.commands.push(c)}
 registerEvent(_e:any){}register(_e:any){}registerInterval(_e:any){}
 addRibbonIcon(icon:string,title:string,cb:any){const el=document.createElement("button");el.className="side-dock-ribbon-action";el.title=title;el.setAttribute("aria-label",title);setIcon(el,icon);el.onclick=cb;document.querySelector("#wide")!.append(el);return el}
 addStatusBarItem(){const el=document.createElement("div");document.querySelector("#wide")!.append(el);return el}
}
class Control {
 constructor(public el:any){}
 setValue(v:any){this.el.value=v;return this}setPlaceholder(v:string){this.el.placeholder=v;return this}
 setButtonText(v:string){this.el.textContent=v;return this}setCta(){this.el.classList.add("mod-cta");return this}removeCta(){this.el.classList.remove("mod-cta");return this}
 setDisabled(v:boolean){this.el.disabled=v;return this}onClick(fn:any){this.el.onclick=fn;return this}onChange(fn:any){this.el.onchange=()=>fn(this.el.value);return this}
 setTooltip(v:string){this.el.title=v;return this}setIcon(v:string){setIcon(this.el,v);return this}
 addOption(v:string,t:string){this.el.append(Object.assign(document.createElement("option"),{value:v,textContent:t}));return this}
 setDesc(_v:string){return this}
}
export class Setting {
 nameEl:any;descEl:any;controlEl:any;settingEl:any;
 constructor(el:any){this.settingEl=el.createDiv({cls:"setting-item"});const info=this.settingEl.createDiv();this.nameEl=info.createDiv({cls:"setting-item-name"});this.descEl=info.createDiv({cls:"setting-item-description"});this.controlEl=this.settingEl.createDiv({cls:"setting-item-control"})}
 setName(t:string){this.nameEl.setText(t);return this}setDesc(t:string){this.descEl.setText(t);return this}setHeading(){return this}
 addComponent(factory:any){factory(this.controlEl);return this}
 addButton(cb:any){cb(new Control(this.controlEl.createEl("button")));return this}
 addText(cb:any){cb(new Control(this.controlEl.createEl("input")));return this}
 addTextArea(cb:any){cb(new Control(this.controlEl.createEl("textarea")));return this}
 addDropdown(cb:any){cb(new Control(this.controlEl.createEl("select")));return this}
 addToggle(cb:any){cb(new Control(this.controlEl.createEl("input",{attr:{type:"checkbox"}})));return this}
}
export class PluginSettingTab {containerEl:any=document.createElement("div");constructor(public app:any,plugin:any){document.querySelector("#wide")!.append(this.containerEl)}}
export class SecretComponent extends Control {constructor(_app:any,el:any){super(el.createEl("input",{attr:{type:"password"}}))}setSecret(_v:any){return this}setValue(v:any){return super.setValue(v)}}
export class Menu {addItem(_cb:any){return this}addSeparator(){return this}showAtMouseEvent(){}}
export const normalizePath=(p:string)=>p.replaceAll("//","/");
export function getLinkpath(p:string){return p.split("#")[0]}
