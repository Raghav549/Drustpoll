import { CanonicalIcon } from './CanonicalIcon';
import type { CanonicalIconName } from './CanonicalIcon';

type Props={size?:number;color?:string;strokeWidth?:number};
const icon=(name:CanonicalIconName)=>(p:Props)=><CanonicalIcon name={name} size={p.size} color={p.color} strokeWidth={p.strokeWidth}/>;
export const HomeIcon=icon('home');export const SearchIcon=icon('search');export const CreateIcon=icon('create');export const ConnectIcon=icon('connect');export const ProfileIcon=icon('profile');export const HeartIcon=icon('heart');export const SaveIcon=icon('bookmark');export const ShareIcon=icon('share');export const MoreIcon=icon('more');export const CloseIcon=icon('close');export const BackIcon=icon('back');export const CheckIcon=icon('check');export const CartIcon=icon('cart');export const LockIcon=icon('lock');export const FilterIcon=icon('filter');export const RefreshIcon=icon('refresh');export const InfoIcon=icon('info');export const AlertIcon=icon('alert');export const CameraIcon=icon('camera');export const MicIcon=icon('mic');export const PauseIcon=icon('pause');export const PlayIcon=icon('play');export const EyeIcon=icon('eye');export const SlidersIcon=icon('sliders');
