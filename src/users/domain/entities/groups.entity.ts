import { v7 } from 'uuid';

interface GroupProps {
  id?: string;
  name: string;
}

export class Group {
  id: string;
  name: string;

  constructor(props: GroupProps) {
    this.id = props.id ?? v7();
    this.name = props.name;
  }
}
