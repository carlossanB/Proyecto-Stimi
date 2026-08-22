export class UploadInformeDto {
  periodo!: string;
  tipo!: 'GC' | 'GF';
  titulo?: string;
  version?: number;
}
