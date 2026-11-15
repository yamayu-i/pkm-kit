// 画面の内容は実装を直接描画する。Obsidian API と周囲の枠だけをモックにする。
import "./mock.ts";
import {h,render} from "preact";
import {TFile,Plugin} from "obsidian";
import {ctx,VIEWS,store} from "../../pkm-task/preview/fixture.tsx";
import {emptyBoard} from "../../pkm-task/src/core/board.ts";
import {TaskIndex} from "../../pkm-task/src/core/index.ts";
import {collectVault} from "../../pkm-task/src/core/load.ts";
import {IssueHeader} from "../../pkm-task/src/header/IssueHeader.tsx";
import {RoutineHeader} from "../../pkm-task/src/header/RoutineHeader.tsx";
import {MemberHeader} from "../../pkm-task/src/header/MemberHeader.tsx";
import {SubTimeline} from "../../pkm-task/src/header/SubTimeline.tsx";
import {TasksNowDialog} from "../../pkm-task/src/views/TasksNowDialog.tsx";
import {openCaptureModal} from "../../pkm-task/src/obsidian/capture.tsx";
import {registerRunningStatusBar} from "../../pkm-task/src/obsidian/status-bar.ts";
import {DailyListView,NoteListView,SourceListView} from "../../pkm-template/src/views/NoteListView.tsx";
import {TmpListView} from "../../pkm-template/src/views/TmpListView.tsx";
import {NoteHeader} from "../../pkm-template/src/obsidian/NoteHeader.tsx";
import {buildHeader} from "../../pkm-template/src/core/note-header.ts";
import {CreateNoteModal} from "../../pkm-template/src/obsidian/CreateNoteModal.tsx";
import {UpdatesView} from "../../pkm-updates/src/views/UpdatesView.tsx";
import {SlidesView} from "../../pkm-slide/src/views/SlidesView.tsx";
import {NotesView} from "../../pkm-slide/src/views/NotesView.tsx";
import Ribbon from "../../pkm-ribbon/src/main.ts";
import Selector from "../../pkm-view-selector/src/main.ts";
import {ConflictsModal,ResolveConflictsModal,FileHistoryModal,SyncLogModal,PreviewModal} from "../../pkm-git/src/obsidian/modals.ts";
import {PkmGitSettingTab,DEFAULT_SETTINGS} from "../../pkm-git/src/obsidian/settings.ts";
import {mountFrame} from "../../pkm-html/src/ui/frame.ts";
import {buildSrcdoc} from "../../pkm-html/src/core/sanitize.ts";
import sample from "../../pkm-html/preview/fixtures/sample.html";
import tokens from "../../pkm-html/tokens.css";
import {DiagramZoomModal} from "../../pkm-diagram/src/obsidian/zoom-modal.ts";
import {DiagramToolbar} from "../../pkm-diagram/src/obsidian/toolbar.ts";
const noop=()=>{}, asyncNoop=async()=>{}, name=location.hash.slice(1), [provider,screen,variant]=name.split("--");
const root=document.createElement("div");root.id="wide";root.className="vt-view vt-ui";root.style.containerType="inline-size";document.body.append(root);
const empty=variant==="empty";
const notes=[
 {path:"daily/2026/11/2026-11-16.md",basename:"2026-11-16",frontmatter:{type:"daily",created:"2026-11-16"}},
 {path:"note/project-plan.md",basename:"project-plan",frontmatter:{type:"note",title:"次の一歩を整理する",tags:["計画"],created:"2026-11-15"}},
 {path:"sources/research.md",basename:"research",frontmatter:{type:"source",title:"調べたことの元資料",origin:"https://example.com/research",retrieved:"2026-11-15"}},
 {path:"wiki/decision.md",basename:"decision",frontmatter:{type:"concept",title:"判断の根拠",sources:["sources/research.md"]}}
];
const files=notes.map(n=>Object.assign(new (TFile as any)(n.path),{frontmatter:n.frontmatter}));
const events={on:()=>({}),offref:noop};
const app:any={
 vault:{...events,getMarkdownFiles:()=>empty?[]:files,getFiles:()=>empty?[]:[...files,new (TFile as any)("tmp/review.html")],getFileByPath:(p:string)=>files.find(f=>f.path===p)||(p.startsWith("issue/")?new (TFile as any)(p):null),getAbstractFileByPath:()=>null,cachedRead:async()=>"## Note\n\n相談先を確かめてから、手順を更新する。\n",read:async()=>"## Note\n\n相談先を確かめてから、手順を更新する。\n",adapter:{exists:async()=>false}},
 metadataCache:{...events,getFileCache:(f:any)=>({frontmatter:f.frontmatter}),resolvedLinks:{}},
 workspace:{...events,onLayoutReady:(fn:any)=>fn(),getLeavesOfType:()=>[],openLinkText:asyncNoop},
 fileManager:{trashFile:asyncNoop},loadLocalStorage:()=>[],saveLocalStorage:noop,
 commands:{commands:{"pkm-task:open-issues":{id:"pkm-task:open-issues",name:"Open Issues"},"pkm-template:open-notes":{id:"pkm-template:open-notes",name:"Open Notes"}},executeCommandById:()=>true},
 viewRegistry:{viewByType:{"pkm-task-issues":{},"pkm-template-notes":{}}},plugins:{getPlugin:()=>({getRibbonBadge:()=>3})}
};
const draw=(component:any,props:any)=>render(h(component,props),root);
(ctx as any).settings.pausedTasks=[];(ctx as any).app=app;
if(provider==="task"){
 if(screen==="previous"){
  const data=store.index.data;
  store.index=new TaskIndex({...data,boards:[...data.boards.filter(b=>b.date!=="2026-11-15"),{date:"2026-11-15",path:"daily/2026/11/2026-11-15.md",board:{...emptyBoard(),issues:["i-4"]}}]});
 }
 if(empty) (store as any).index=new TaskIndex(collectVault({markdown:[],worklogs:[],boardLogs:[],labels:"[]",parseYaml:()=>({})}).data);
 const headers:any={header:IssueHeader,routine:RoutineHeader,member:MemberHeader};
 if(headers[screen!]){root.className="vt-header vt-ui";draw(headers[screen!],{ctx,path:screen==="routine"?"routine/r-1.md":screen==="member"?"member/m-1.md":variant==="unpicked"?"issue/i-14.md":variant==="closed"?"issue/i-12.md":"issue/i-2.md"})}
 else if(screen==="timeline") draw(SubTimeline,{ctx,subs:store.index.subs("i-2"),scale:"day"});
 else if(screen==="now")draw(TasksNowDialog,{ctx});
 else if(screen==="capture")openCaptureModal(ctx as never);
 else if(screen==="status")registerRunningStatusBar(new (Plugin as any)(app),store as never,{path:noop,sidebar:noop});
 else {draw(VIEWS[screen==="previous"?"daily":screen!],{ctx});if(["board","pick","previous"].includes(screen!))setTimeout(()=>root.querySelectorAll<HTMLButtonElement>(".vt-step")[screen==="board"?3:screen==="pick"?2:1]?.click(),0)}
} else if(provider==="template"){
 const views:any={daily:DailyListView,notes:NoteListView,sources:SourceListView,tmp:TmpListView};
 if(views[screen!])draw(views[screen!],{app});
 else if(screen==="header")draw(NoteHeader,{app,model:buildHeader(notes[variant==="daily"?0:variant==="source"?2:variant==="wiki"?3:1]!,{notes,backlinks:2})});
 else new CreateNoteModal(app,{takenNames:()=>[],fileExists:()=>variant==="duplicate",createNoteFromTemplate:asyncNoop} as never,empty?[]:[{entry:{file:"note.md",folder:"note",fileNamePattern:""},content:"# {{title}}",prompts:[],datePrompts:[]}] as never,noop).open();
} else if(provider==="updates"){
 const model:any={version:1,subscribe:()=>noop,since:null,sections:empty?[]:[{id:"issues",title:"Issues",command:"pkm-task:open-issues",items:[{path:"issue/i-1.md",title:"次の一歩を決める",updatedMs:Date.now()-3600000}]}],markViewed:asyncNoop};draw(UpdatesView,{app,model,deviceName:()=>"preview"});
} else if(provider==="ribbon")new (Ribbon as any)(app).onload();
else if(provider==="selector"){const p=new (Selector as any)(app);p.onload();p.commands[0].callback()}
else if(provider==="git"){
 if(screen==="conflicts")new ConflictsModal(app,"Unresolved conflicts",empty?[]:[{path:"note/plan.md",note:"両方の内容を残しています",actions:[{label:"Resolve",run:noop}]}]).open();
 else if(screen==="resolve")new ResolveConflictsModal(app,"note/plan.md",[{type:"conflict",localLabel:"Local",remoteLabel:"Remote",local:"先に資料を読む\n",remote:"先に相談する\n"}] as never,noop).open();
 else if(screen==="history")new FileHistoryModal(app,"note/plan.md",{versions:empty?[]:[{oid:"a".repeat(40),time:Date.now(),author:"Preview",kind:"kept",name:"見直し前"}],atStart:true,canDeepen:false} as never,{loadMore:async()=>null,preview:noop,restore:noop}).open();
 else if(screen==="preview")new PreviewModal(app,"見直し前","# 計画\n\n次の一歩を決める。",64).open();
 else if(screen==="log")new SyncLogModal(app,empty?[]:[{time:"2026-11-16T10:00:00+09:00",level:"warn",event:"retry",message:"別の更新を取り込み直しました"}] as never).open();
 else new PkmGitSettingTab(app,{settings:{...DEFAULT_SETTINGS,deviceName:"preview"},saveSettings:asyncNoop} as never).display();
}else if(provider==="slide"){
 const path="slide/planning";
 if(screen==="notes"){
  const source='<html><body><section class="slide" data-pattern="statement"><header class="sl-head"><h2>次の一歩を決める</h2></header><aside class="speaker-notes">場面から説明を始める。</aside></section></body></html>';
  const file=new (TFile as any)(path+"/deck.html");
  draw(NotesView,{app:{...app,vault:{...app.vault,getFileByPath:()=>file,read:async()=>source}},deckPath:path,register:noop});
 }
 else draw(SlidesView,{app,model:{snapshot:{tree:{folders:["slide"],decks:empty?[]:[{path}]},decks:empty?[]:[{path,title:"一日の計画",slides:3,mtime:Date.now(),index:null}]},subscribe:()=>noop},actions:new Proxy({},{get:()=>asyncNoop})});
}else if(provider==="html"){
 root.style.height="780px";
 buildSrcdoc(sample,{theme:document.body.classList.contains("theme-dark")?"dark":"light",tokensCss:tokens,path:"sample.html",readImage:async()=>null,parse:(html:string)=>new DOMParser().parseFromString(html,"text/html")} as never).then(src=>mountFrame(root,src,{from:"sample.html",openVault:noop,openExternal:noop}));
}else if(provider==="diagram"){
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 180"><rect width="600" height="180" fill="#f6f5f2"/><text x="32" y="80" font-size="24" fill="#2b2a28">場面を選ぶ → 操作する → 記録が残る</text></svg>';
 const src="data:image/svg+xml,"+encodeURIComponent(svg);
 if(screen==="zoom")new DiagramZoomModal(app,{src,title:"体験の流れ"}).open();
 else {const img=document.createElement("img");img.src=src;img.style.width="100%";root.append(img);new DiagramToolbar({resolve:(el:any)=>el===img?{el:img,target:{kind:"file",file:new (TFile as any)("asset/flow.svg")}}:null,copy:noop,save:noop,expand:noop}).attach(document,(doc:any,type:any,cb:any,capture:any)=>doc.addEventListener(type,cb,{capture}));}
}
(window as any).guideReady=true;
