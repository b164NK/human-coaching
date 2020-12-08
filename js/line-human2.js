window.onload = function(){
  //タッチイベントが利用可能かどうかの判別
	var supportTouch = 'ontouchend' in document;

	//イベント名の決定
	const EVENTNAME_START = supportTouch? 'touchstart':'mousedown';
	const EVENTNAME_MOVE = supportTouch? 'touchmove':'mousemove';
	const EVENTNAME_END = supportTouch? 'touchend':'mouseup';

  // Get a reference to the database service
  var database = firebase.database();

	//Vueインスタンスが存在するかどうかを判別するフラグ
	var first = true;

	//更新内容を一時保存する変数
	var updates = {};


	function renewDB(update_set){
		//update_setは、行われたDOM操作に関して記録したリストとする
		console.log("DB update");
		database.ref("").update(update_set);
		//updatesを初期化
		updates = {};
	};

	//Vueインスタンスをいれる変数
	//インスタンス外部からメソッドを呼ぶのに利用する
	var vm;

  function createV(fss){
    vm = new Vue({
      el:"#app",
      data:{
        canvas:       0,
        scene:        new THREE.Scene(),
        renderer:     new THREE.WebGLRenderer({anitialias: true}),
        camera:       new THREE.PerspectiveCamera(45,1,1,10000),
        controls:     0,
        light:        new THREE.DirectionalLight(0xFFFFFF, 1),
        human:        new THREE.Group(),
        //アニメーションクリップを保持(データベースとのデータ共有に使用)
        clips:        [],
				//ミキサーを保持(アニメーション実行に使用)
				mixers:				[],
        //アニメーションアクションを保持(アニメーション実行に使用)
        actions:      [],
        eventstart:   EVENTNAME_START,
        eventmove:    EVENTNAME_MOVE,
        eventend:     EVENTNAME_END
      },
      methods:{
				//データが変更された時実行する
        changed_DB_bySomeone:function(ss){

        },
				//アニメーションを再生する
				animate:function(e){
					requestAnimationFrame(this.animate);

					this.mixers[0].update(0.01);
					this.mixers[1].update(0.01);

					this.controls.update();

					this.renderer.render(this.scene, this.camera);

				}
      },
      mounted(){
        this.canvas = document.getElementById('canvas');
        this.canvas.appendChild(this.renderer.domElement);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera.position.set(0, 400, 1000);
        this.camera.lookAt(new THREE.Vector3(0,100,0));

        this.controls = new THREE.OrbitControls(this.camera);

        //地面を作成
        const plane2 = new THREE.GridHelper(600);
        this.scene.add(plane2);
        const plane = new THREE.AxesHelper(300);
        this.scene.add(plane);

        //体
        const body_material = new THREE.MeshNormalMaterial();
        const body_geometry = new THREE.BoxGeometry(50,150,50);
        const body = new THREE.Mesh(body_geometry,body_material);
        body.position.set(0,250,0);
        this.human.add(body);

        //頭
        const head_geometry = new THREE.SphereGeometry(30,30,30);
        const head = new THREE.Mesh(head_geometry,body_material);
        head.position.set(0,110,0);
        body.add(head)

        //腕
        const arm_material =  new THREE.LineBasicMaterial({
          color:'white'
        });
        const right_arm_points = [];
        right_arm_points.push(new THREE.Vector3(0,0,0));
        right_arm_points.push(new THREE.Vector3(-50,0,0));
        const right_arm_geometry = new THREE.BufferGeometry().setFromPoints( right_arm_points );
        const right_arm_1 = new THREE.Line( right_arm_geometry, arm_material );
        const right_arm_2 = right_arm_1.clone();
        right_arm_2.position.set(-50,0,0);
        right_arm_1.add(right_arm_2);
        right_arm_1.position.set(-25,75,0);
        body.add(right_arm_1);

        const left_arm_points = [];
        left_arm_points.push(new THREE.Vector3(0,0,0));
        left_arm_points.push(new THREE.Vector3(50,0,0));
        const left_arm_geometry = new THREE.BufferGeometry().setFromPoints( left_arm_points );
        const left_arm_1 = new THREE.Line( left_arm_geometry, arm_material );
        const left_arm_2 = left_arm_1.clone();
        left_arm_2.position.set(50,0,0);
        left_arm_1.add(left_arm_2);
        left_arm_1.position.set(25,75,0);
        body.add(left_arm_1);

        //腰
        const waist_geometry = new THREE.BoxGeometry(50,20,50);
        const waist = new THREE.Mesh(waist_geometry, body_material);
        this.human.add(waist);
        waist.position.set(0,160,0);

        //足
        const foot_material =  new THREE.LineBasicMaterial({
          color:'white'
        });
        const right_foot_points = [];
        right_foot_points.push(new THREE.Vector3(0,0,0));
        right_foot_points.push(new THREE.Vector3(0,-80,0));
        const right_foot_geometry = new THREE.BufferGeometry().setFromPoints( right_foot_points );
        const right_foot_1 = new THREE.Line( right_foot_geometry, foot_material );
        const right_foot_2 = right_foot_1.clone();
        right_foot_2.position.set(0,-80,0);
        right_foot_1.add(right_foot_2);
        right_foot_1.position.set(-25,0,0);
        waist.add(right_foot_1);

        const left_foot_points = [];
        left_foot_points.push(new THREE.Vector3(0,0,0));
        left_foot_points.push(new THREE.Vector3(0,-80,0));
        const left_foot_geometry = new THREE.BufferGeometry().setFromPoints( left_foot_points );
        const left_foot_1 = new THREE.Line( left_foot_geometry, foot_material );
        const left_foot_2 = left_foot_1.clone();
        left_foot_2.position.set(0,-80,0);
        left_foot_1.add(left_foot_2);
        left_foot_1.position.set(25,0,0);
        waist.add(left_foot_1);

        this.scene.add(this.human);

        //これより以下でfssからアニメーションクリップを作成
				var rotationKeyframeTrackJSON_Body = {
					name:".children[0].rotation[y]",
					type:"number",
					times:[0],
					values:[0]
				};
				var rotationKeyframeTrackJSON_RightArm = {
					name:".rotation[y]",
					type:"number",
					times:[0],
					values:[0]
				};
				var rotationKeyframeTrackJSON_RightArm2 = {
					name:".children[0].rotation[z]",
					type:"number",
					times:[0],
					values:[0]
				};

				var clipJSON = {
					duration: -1,
					name:"human_animation",
					tracks: [
						rotationKeyframeTrackJSON_Body
					]
				};
				var clipJSON_2 = {
					duration: -1,
					name:"right_arm_animation",
					tracks: [
						rotationKeyframeTrackJSON_RightArm,
						rotationKeyframeTrackJSON_RightArm2
					]
				};

				var clip = THREE.AnimationClip.parse(clipJSON);
				var clip2 = THREE.AnimationClip.parse(clipJSON_2);
				this.clips.push(clip);
				this.clips.push(clip2);


				this.clips[1].tracks[0].times = fss.child('AnimationClip/right_arm_1//times').val();
				this.clips[1].tracks[0].values = fss.child('AnimationClip/right_arm_1/y/values').val();
				this.clips[1].tracks[1].times = fss.child('AnimationClip/right_arm_2/z/times').val();
				this.clips[1].tracks[1].values = fss.child('AnimationClip/right_arm_2/z/values').val();


				var human_mixer = new THREE.AnimationMixer(this.human);
		    var right_arm_mixer = new THREE.AnimationMixer(right_arm_1);
		    var left_arm_mixer = new THREE.AnimationMixer(left_arm_1);
		    var right_foot_mixer = new THREE.AnimationMixer(right_foot_1);
		    var left_foot_mixer = new THREE.AnimationMixer(left_foot_1);
				this.mixers.push(human_mixer);
				this.mixers.push(right_arm_mixer);
				this.mixers.push(left_arm_mixer);
				this.mixers.push(right_arm_mixer);
				this.mixers.push(left_arm_mixer);

		    var human_action = human_mixer.clipAction(this.clips[0]);
		    var right_arm_action = right_arm_mixer.clipAction(this.clips[1]);
				this.actions.push(human_action);
				this.actions.push(right_arm_action);

		    this.actions[0].play();
		    this.actions[1].play();

        this.renderer.render(this.scene, this.camera)
				this.animate();

      }
    });
  };

  function waitRTDBload(){
    database.ref('/student').on('value',function(snapshot){
      if(!first){
        vm.changed_DB_bySomeone(snapshot);
      }else{
        createV(snapshot);
        first = false;
      }
    });
  };

  waitRTDBload();
}
