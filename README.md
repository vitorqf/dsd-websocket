# Lidando com desconexão

Através do tutorial disponível na documentação do SocketIO, foi possível verificar que para lidar com esse tipo de incedente é necessário criar um banco de dados para guardar as mensagens que foram perdidas num intervalo de tempo em buffer, dessa forma, quando o socket for reconectado, as mensagens serão reenviadas para o client correto.
