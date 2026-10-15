import type { SVGProps } from "react";

export default function ObserverAvatar(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 48 72" fill="none" {...props}>
    <title>穿黃色上衣的觀察小隊員</title>
    <g strokeLinejoin="round" strokeLinecap="round">
      <path d="M24 4c-7 0-11 5-11 11 0 5 2 9 5 11l-7 4-7 16 6 4 6-12 1 12-3 17 9 1 2-14 2 14 9-1-4-17 1-12 5 12 6-4-7-16-7-4c3-2 5-6 5-11C35 9 31 4 24 4Z" fill="white" stroke="white" strokeWidth="5"/>
      <path d="m17 48-3 17 8 1 3-15 3 15 8-1-5-17" fill="#3285ed" stroke="#163650" strokeWidth="2"/>
      <path d="m13 65 9 1v4H12l1-5Zm15 1 8-1 2 5H28v-4Z" fill="#183650" stroke="#183650" strokeWidth="2"/>
      <path d="m15 29-5 6-6 12 6 3 7-14m16-7 5 6 6 12-6 3-7-14" fill="#ffcd9d" stroke="#163650" strokeWidth="2"/>
      <path d="m17 27-6 4 5 9v11h16V40l5-9-6-4H17Z" fill="#ffd438" stroke="#163650" strokeWidth="2"/>
      <path d="M20 28v19m8-19v19" stroke="#ed8a23" strokeWidth="3"/>
      <path d="m20 38 4-3 4 3-1 6h-6l-1-6Z" fill="#39b8ac" stroke="#163650" strokeWidth="1.5"/>
      <circle cx="24" cy="16" r="10" fill="#ffcd9d" stroke="#163650" strokeWidth="2"/>
      <path d="M14 14C12 4 26 0 32 8l2 8-6-6-4 4-3-3-7 3Z" fill="#27364b" stroke="#163650" strokeWidth="1.5"/>
      <path d="M20 17v1m8-1v1" stroke="#163650" strokeWidth="2.3"/>
      <path d="M21 22q3 3 6 0" stroke="#ac4e39" strokeWidth="1.5"/>
    </g>
  </svg>;
}